import {
  AppKit,
  type BridgeParams,
  type BridgeResult,
  type BridgeStep,
  type EstimateResult,
  type SendParams as AppKitSendParams,
} from "@circle-fin/app-kit";
import type { WhiskConfig } from "../types/config.js";
import type { ResolvedRecipient } from "../types/recipient.js";
import type { Quote } from "../types/quote.js";
import type { Step, StepName } from "../types/step.js";
import { DEFAULT_TOKEN } from "../types/token.js";
import { decideRoute } from "../routing/decide.js";
import { addressResolver } from "../resolvers/address.js";
import {
  type AppKitEstimateFee,
  buildCustomFeeEntries,
  fromAppKitFees,
  sumFees,
} from "../fees/calculate.js";
import { explorerTxUrl } from "../chains/registry.js";
import {
  ConfigError,
  InvalidAddressError,
  toWhiskError,
  WhiskError,
} from "../errors/errors.js";
import type {
  QuoteParams,
  RetryParams,
  SendListeners,
  SendParams,
  SendResult,
  WhiskEngine,
} from "./types.js";

/**
 * Instantiate a Whisk engine bound to the given config. The engine wraps a
 * single `AppKit` instance — the same kit is reused across `quote` / `send`
 * so SDK-internal caches stay warm.
 *
 * The engine is stateless beyond holding the AppKit instance; concurrent
 * sends are safe (each call creates its own listener bag). The React layer
 * does not need to memoise the engine across renders, but doing so saves
 * AppKit construction cost.
 */
export function createWhisk(config: WhiskConfig): WhiskEngine {
  if (!config.chains || config.chains.length === 0) {
    throw new ConfigError("createWhisk: at least one chain is required.");
  }

  const kit = new AppKit();
  const token = config.token ?? DEFAULT_TOKEN;
  const resolver = config.resolver ?? addressResolver;

  const engine: WhiskEngine = {
    config,

    /* ---------------------------------------------------------------- *
     *  resolve                                                          *
     * ---------------------------------------------------------------- */

    async resolve(input, chain): Promise<ResolvedRecipient> {
      const trimmed = input.trim();
      if (!trimmed) throw new InvalidAddressError(input);
      if (!resolver.matches(trimmed)) throw new InvalidAddressError(trimmed);
      try {
        const result = await resolver.resolve(trimmed, { chain });
        if (!result) throw new InvalidAddressError(trimmed);
        return result;
      } catch (err) {
        if (err instanceof WhiskError) throw err;
        throw toWhiskError(err, "Resolution failed");
      }
    },

    /* ---------------------------------------------------------------- *
     *  quote                                                            *
     * ---------------------------------------------------------------- */

    async quote(params: QuoteParams): Promise<Quote> {
      const route = decideRoute(params.sourceChain, params.destinationChain);
      const adapter = params.adapter.appKitAdapter;
      const customFees = buildCustomFeeEntries(config.feePolicy, token);
      const amountIn = addCustomFee(params.amount, config.feePolicy?.value);

      try {
        if (route.kind === "send") {
          const appKitParams: AppKitSendParams = {
            from: { adapter, chain: route.chain },
            to: params.recipient.address,
            amount: params.amount,
            token,
          };
          // estimateSend returns gas-only (`EstimatedGas`); same-chain
          // sends carry no protocol fees worth surfacing in the breakdown.
          await kit.estimateSend(appKitParams);
          const breakdown = sumFees([...customFees], token);
          return {
            route,
            recipient: params.recipient,
            amountIn,
            amountOut: params.amount,
            token,
            fees: breakdown,
            estimatedDurationMs: 15_000,
          };
        }

        const appKitParams: BridgeParams = {
          from: { adapter, chain: route.sourceChain },
          to: {
            adapter,
            chain: route.destinationChain,
            recipientAddress: params.recipient.address,
            useForwarder: config.useForwarder ?? false,
          },
          amount: params.amount,
        };
        const estimate: EstimateResult = await kit.estimateBridge(appKitParams);
        const protocolFees = fromAppKitFees(
          estimate.fees as ReadonlyArray<AppKitEstimateFee>,
          token,
        );
        const breakdown = sumFees([...customFees, ...protocolFees], token);
        return {
          route,
          recipient: params.recipient,
          amountIn,
          amountOut: params.amount,
          token,
          fees: breakdown,
          // CCTP fast-burn typically completes in <30s, varies in practice.
          // The UI shows this as a hint, not a guarantee.
          estimatedDurationMs: 30_000,
        };
      } catch (err) {
        throw toWhiskError(err, "Quote failed");
      }
    },

    /* ---------------------------------------------------------------- *
     *  send                                                             *
     * ---------------------------------------------------------------- */

    async send(params: SendParams, listeners?: SendListeners) {
      return runSend(kit, config, params, listeners);
    },

    /* ---------------------------------------------------------------- *
     *  retry                                                            *
     * ---------------------------------------------------------------- */

    async retry(params: RetryParams, listeners?: SendListeners) {
      try {
        const raw = params.failed.raw as BridgeResult | undefined;
        if (!raw) {
          throw new ConfigError(
            "retry: cannot resume — original bridge result was not preserved.",
          );
        }
        const adapter = params.adapter.appKitAdapter;
        const result = await kit.retryBridge(raw, {
          from: adapter,
          to: adapter,
        });
        return mapAppKitBridgeResult(result, listeners);
      } catch (err) {
        return {
          kind: "failure" as const,
          error: toWhiskError(err, "Retry failed"),
          steps: params.failed.steps,
        };
      }
    },
  };

  return engine;
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */

function addCustomFee(amount: string, customFee?: string): string {
  if (!customFee) return amount;
  const a = parseFloat(amount);
  const c = parseFloat(customFee);
  if (Number.isNaN(a) || Number.isNaN(c)) return amount;
  const sum = a + c;
  return sum.toFixed(6).replace(/\.?0+$/, "") || "0";
}

/**
 * Bridge lifecycle action names exposed by App Kit's event bus. We mirror
 * the union locally so the listener attachment loop is exhaustively typed.
 */
type BridgeAction = "approve" | "burn" | "fetchAttestation" | "mint";
const BRIDGE_ACTIONS: ReadonlyArray<BridgeAction> = [
  "approve",
  "burn",
  "fetchAttestation",
  "mint",
];

/**
 * Drive a send / bridge through App Kit and translate the result into
 * Whisk's normalised shape, streaming step updates to the optional
 * listener as App Kit emits them.
 */
async function runSend(
  kit: AppKit,
  config: WhiskConfig,
  params: SendParams,
  listeners?: SendListeners,
): Promise<SendResult> {
  const route = params.quote.route;
  const token = config.token ?? DEFAULT_TOKEN;
  const adapter = params.adapter.appKitAdapter;
  const onStep = listeners?.onStep;

  const detach: Array<() => void> = [];

  if (route.kind === "bridge" && onStep) {
    for (const action of BRIDGE_ACTIONS) {
      const handler = (payload: unknown) => {
        onStep(translateAppKitEvent(action, payload));
      };
      // App Kit's `on` accepts string action names; payload is `unknown` to
      // the consumer because App Kit doesn't publish a per-action payload
      // schema. We narrow the relevant fields in `translateAppKitEvent`.
      kit.on(`bridge.${action}`, handler);
      detach.push(() => kit.off(`bridge.${action}`, handler));
    }
  }

  try {
    if (route.kind === "send") {
      onStep?.({ name: "transfer", state: "pending" });
      const appKitParams: AppKitSendParams = {
        from: { adapter, chain: route.chain },
        to: params.recipient.address,
        amount: params.amount,
        token,
      };
      const result: BridgeStep = await kit.send(appKitParams);
      const transferStep: Step = {
        name: "transfer",
        state: result.state,
        txHash: result.txHash,
        explorerUrl:
          result.explorerUrl ??
          (result.txHash ? explorerTxUrl(route.chain, result.txHash) : undefined),
        errorMessage: result.errorMessage,
        forwarded: result.forwarded,
      };
      onStep?.(transferStep);
      if (result.state === "error") {
        return {
          kind: "failure",
          error: toWhiskError(result.errorMessage ?? "Send failed."),
          steps: [transferStep],
        };
      }
      return {
        kind: "success",
        finalTxHash: result.txHash,
        steps: [transferStep],
      };
    }

    // Bridge route
    const appKitParams: BridgeParams = {
      from: { adapter, chain: route.sourceChain },
      to: {
        adapter,
        chain: route.destinationChain,
        recipientAddress: params.recipient.address,
        useForwarder: config.useForwarder ?? false,
      },
      amount: params.amount,
    };
    const result = await kit.bridge(appKitParams);
    return mapAppKitBridgeResult(result, listeners);
  } catch (err) {
    return {
      kind: "failure",
      error: toWhiskError(err, "Send failed"),
      steps: [],
    };
  } finally {
    for (const off of detach) off();
  }
}

/**
 * Narrow shape we extract from App Kit's bridge event payload. The SDK
 * doesn't publish a per-action schema (`(payload: any) => void`), so we
 * pick out the fields documented in the source events.
 */
type AppKitBridgeEventPayload = {
  state?: Step["state"];
  txHash?: string;
  explorerUrl?: string;
  forwarded?: boolean;
  values?: { txHash?: string; explorerUrl?: string };
  error?: { message?: string };
};

function translateAppKitEvent(
  name: BridgeAction,
  payload: unknown,
): Step {
  const p = (payload ?? {}) as AppKitBridgeEventPayload;
  return {
    name: name as StepName,
    state: p.state ?? "pending",
    txHash: p.txHash ?? p.values?.txHash,
    explorerUrl: p.explorerUrl ?? p.values?.explorerUrl,
    errorMessage: p.error?.message,
    forwarded: p.forwarded,
  };
}

/**
 * Translate an App Kit `BridgeResult` into Whisk's `SendResult`,
 * preserving the raw result on failures so `retry()` can resume.
 */
function mapAppKitBridgeResult(
  raw: BridgeResult,
  listeners?: SendListeners,
): SendResult {
  const steps: Step[] = (raw.steps ?? []).map((s: BridgeStep) => stepFromBridgeStep(s));
  const onStep = listeners?.onStep;
  if (onStep) for (const s of steps) onStep(s);

  if (raw.state === "success") {
    return {
      kind: "success",
      finalTxHash: steps.find((s) => s.name === "mint")?.txHash,
      steps,
    };
  }

  const errorStep = steps.find((s) => s.state === "error");
  return {
    kind: "failure",
    error: toWhiskError(
      errorStep?.errorMessage ?? "Bridge failed without a step error.",
    ),
    steps,
    raw,
  };
}

function stepFromBridgeStep(s: BridgeStep): Step {
  const dataExplorer =
    s.data &&
    typeof s.data === "object" &&
    "explorerUrl" in (s.data as object) &&
    typeof (s.data as { explorerUrl?: unknown }).explorerUrl === "string"
      ? (s.data as { explorerUrl: string }).explorerUrl
      : undefined;
  return {
    name: s.name as StepName,
    state: s.state,
    txHash: s.txHash,
    explorerUrl: s.explorerUrl ?? dataExplorer,
    errorMessage: s.errorMessage,
    forwarded: s.forwarded,
  };
}
