import {
  AppKit,
  type BridgeParams,
  type BridgeResult,
  type BridgeStep,
  type EstimateResult,
  type SendParams as AppKitSendParams,
  type SwapParams as AppKitSwapParams,
  type SwapResult as AppKitSwapResult,
} from "@circle-fin/app-kit";
import type { WhiskConfig } from "../types/config.js";
import type { ResolvedRecipient } from "../types/recipient.js";
import type { Quote } from "../types/quote.js";
import type { Step, StepName } from "../types/step.js";
import { DEFAULT_TOKEN } from "../types/token.js";
import { decideRoute } from "../routing/decide.js";
import { resolveMode } from "../chains/mode.js";
import { addressResolver } from "../resolvers/address.js";
import {
  type AppKitEstimateFee,
  buildCustomFeeEntries,
  fromAppKitFees,
  sumFees,
} from "../fees/calculate.js";
import { chainInfo, explorerTxUrl } from "../chains/registry.js";
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
  SwapEstimate,
  SwapParams,
  SwapResult,
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

  // Resolve mode up front and bake it into the engine's exposed
  // config. Consumers read `engine.config.mode` to drive UI (the
  // visible "Testnet" pill), recovery storage namespacing, and the
  // default resolver composition in the React layer.
  const resolvedMode = resolveMode(config.mode, config.chains);
  const resolvedConfig: WhiskConfig = { ...config, mode: resolvedMode };

  // App Kit 1.5.0 introduced unhandled-error telemetry that POSTs to
  // Circle's collection endpoint. Whisk is an embeddable widget — host
  // apps don't expect the underlying SDK to send their error events
  // anywhere, so we opt out by default. Consumers who want it can fork
  // or open an issue; flipping a default-on telemetry channel without
  // surfacing it in our own config would be a trust violation.
  const kit = new AppKit({ disableErrorReporting: true });
  const defaultToken = resolvedConfig.token ?? DEFAULT_TOKEN;
  const resolver = resolvedConfig.resolver ?? addressResolver;

  const engine: WhiskEngine = {
    config: resolvedConfig,

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
      // Same-chain sends honour the user's token choice; cross-chain
      // bridges always use USDC (App Kit Bridge is USDC-only). The
      // `effectiveToken` we surface in the Quote reflects what's
      // actually being moved on-chain.
      const requested = params.token ?? defaultToken;
      const effectiveToken = route.kind === "bridge" ? "USDC" : requested;
      const customFees = buildCustomFeeEntries(
        config.feePolicy,
        effectiveToken,
      );
      const amountIn = addCustomFee(params.amount, config.feePolicy?.value);

      try {
        if (route.kind === "send") {
          const appKitParams: AppKitSendParams = {
            from: { adapter, chain: route.chain },
            to: params.recipient.address,
            amount: params.amount,
            token: effectiveToken,
          };
          // estimateSend returns gas-only (`EstimatedGas`); same-chain
          // sends carry no protocol fees worth surfacing in the breakdown.
          await kit.estimateSend(appKitParams);
          const breakdown = sumFees([...customFees], effectiveToken);
          return {
            route,
            recipient: params.recipient,
            amountIn,
            amountOut: params.amount,
            token: effectiveToken,
            fees: breakdown,
            estimatedDurationMs: 15_000,
          };
        }

        const appKitParams = buildBridgeParams(
          adapter,
          route.sourceChain,
          route.destinationChain,
          params.recipient.address,
          params.amount,
          config.useForwarder ?? true,
        );
        const estimate: EstimateResult = await kit.estimateBridge(appKitParams);
        const protocolFees = fromAppKitFees(
          estimate.fees as ReadonlyArray<AppKitEstimateFee>,
          effectiveToken,
        );
        const breakdown = sumFees(
          [...customFees, ...protocolFees],
          effectiveToken,
        );
        return {
          route,
          recipient: params.recipient,
          amountIn,
          amountOut: params.amount,
          token: effectiveToken,
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
      return runSend(kit, resolvedConfig, params, listeners);
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

    /* ---------------------------------------------------------------- *
     *  estimateSwap                                                     *
     * ---------------------------------------------------------------- */

    async estimateSwap(params: SwapParams): Promise<SwapEstimate> {
      try {
        const appKitParams = buildAppKitSwapParams(params);
        // App Kit's `estimateSwap` is the safe pre-flight; output and
        // fees come from the swap provider's quote API.
        const estimate = await kit.estimateSwap(appKitParams);
        return mapAppKitSwapEstimate(estimate, params);
      } catch (err) {
        throw toWhiskError(err, "Swap estimate failed");
      }
    },

    /* ---------------------------------------------------------------- *
     *  swap                                                             *
     * ---------------------------------------------------------------- */

    async swap(params: SwapParams): Promise<SwapResult> {
      try {
        const appKitParams = buildAppKitSwapParams(params);
        const result = (await kit.swap(appKitParams)) as AppKitSwapResult;
        return {
          kind: "success",
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          amountOut: result.amountOut,
        };
      } catch (err) {
        return {
          kind: "failure",
          error: toWhiskError(err, "Swap failed"),
        };
      }
    },
  };

  return engine;
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Build the `BridgeParams` App Kit expects, choosing same-adapter mode for
 * same-ecosystem hops (EVM → EVM) and the **Forwarder** pattern for cross-
 * ecosystem hops (Solana ↔ EVM).
 *
 * Why: App Kit's adapters are ecosystem-scoped — a Viem adapter rejects
 * Solana chains, a SolanaKit adapter rejects EVM chains. Cross-ecosystem
 * estimates and sends therefore can't reuse the source adapter on the
 * destination side. The forwarder pattern (`to: { recipientAddress, chain,
 * useForwarder: true }`) lets Circle's Iris service do the destination mint
 * — the user signs only the source-side burn. Same-ecosystem callers can
 * still opt into the forwarder via `config.useForwarder` to skip the
 * destination-side gas; cross-ecosystem callers always get it.
 */
function buildBridgeParams(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: any,
  sourceChain: ReturnType<typeof chainInfo>["chain"],
  destinationChain: ReturnType<typeof chainInfo>["chain"],
  recipientAddress: string,
  amount: string,
  preferForwarder: boolean,
): BridgeParams {
  const sameEcosystem =
    chainInfo(sourceChain).kind === chainInfo(destinationChain).kind;
  const useForwarder = sameEcosystem ? preferForwarder : true;

  if (sameEcosystem && !useForwarder) {
    return {
      from: { adapter, chain: sourceChain },
      to: { adapter, chain: destinationChain, recipientAddress },
      amount,
    } as BridgeParams;
  }

  // Forwarder path — destination has no adapter.
  return {
    from: { adapter, chain: sourceChain },
    to: { chain: destinationChain, recipientAddress, useForwarder: true },
    amount,
  } as BridgeParams;
}

/**
 * Translate Whisk's `SwapParams` into App Kit's `SwapParams`. The
 * shapes are 90% the same; we just pass through the adapter, chain,
 * tokens, and slippage / stop-limit if set.
 */
function buildAppKitSwapParams(p: SwapParams): AppKitSwapParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any = { kitKey: p.kitKey };
  if (p.slippageBps !== undefined) cfg.slippageBps = p.slippageBps;
  if (p.stopLimit !== undefined) cfg.stopLimit = p.stopLimit;
  return {
    from: { adapter: p.adapter.appKitAdapter, chain: p.chain },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenIn: p.tokenIn as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenOut: p.tokenOut as any,
    amountIn: p.amountIn,
    config: cfg,
  } as AppKitSwapParams;
}

/**
 * Map App Kit's `SwapEstimate` into Whisk's normalised shape. App Kit
 * returns `estimatedOutput` and `stopLimit` as `{ amount, token }` —
 * we flatten so consumers see a string-only API.
 */
function mapAppKitSwapEstimate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estimate: any,
  params: SwapParams,
): SwapEstimate {
  const fees = Array.isArray(estimate?.fees) ? estimate.fees : [];
  const entries = fees.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any) => ({
      kind: typeof f.type === "string" ? f.type : "provider",
      amount: typeof f.amount === "string" ? f.amount : "0",
      token: typeof f.token === "string" ? f.token : params.tokenIn,
    }),
  );
  const total = entries
    .filter((e: { token: string }) => e.token === params.tokenIn)
    .reduce(
      (acc: number, e: { amount: string }) =>
        acc +
        (Number.isFinite(parseFloat(e.amount)) ? parseFloat(e.amount) : 0),
      0,
    );
  return {
    amountIn: estimate?.amountIn ?? params.amountIn,
    amountOut: estimate?.estimatedOutput?.amount ?? "0",
    minOutput:
      estimate?.stopLimit?.amount ?? estimate?.estimatedOutput?.amount ?? "0",
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    fees: { total: total.toString(), entries },
  };
}

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
  // Bridge always operates on USDC; sends honour the user's token choice
  // (params.token) and fall back to the engine default when omitted.
  const token =
    route.kind === "bridge"
      ? "USDC"
      : (params.token ?? params.quote.token ?? config.token ?? DEFAULT_TOKEN);
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
          (result.txHash
            ? explorerTxUrl(route.chain, result.txHash)
            : undefined),
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
    const appKitParams = buildBridgeParams(
      adapter,
      route.sourceChain,
      route.destinationChain,
      params.recipient.address,
      params.amount,
      config.useForwarder ?? true,
    );
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
 * Narrow shape we extract from App Kit's bridge event payload.
 *
 * The SDK dispatches each step event with this envelope:
 *
 *   {
 *     protocol: 'cctp',
 *     version: 'v2',
 *     traceId?: string,
 *     method: 'approve' | 'burn' | 'fetchAttestation' | 'mint',
 *     values: BridgeStep   // ← the actual step (state, txHash, etc.)
 *   }
 *
 * Events fire **once the step lands** — `values.state` is `'success'` or
 * `'error'`, not `'pending'`. The previous version of this function
 * defaulted to `'pending'` which is why the rail never flipped green
 * mid-flow. Now we pull the state straight off `payload.values`.
 */
type AppKitBridgeEventPayload = {
  protocol?: string;
  version?: string;
  traceId?: string;
  method?: string;
  values?: {
    name?: string;
    state?: Step["state"];
    txHash?: string;
    explorerUrl?: string;
    forwarded?: boolean;
    errorMessage?: string;
    errorCategory?: Step["errorCategory"];
    error?: { message?: string };
  };
};

function translateAppKitEvent(name: BridgeAction, payload: unknown): Step {
  const p = (payload ?? {}) as AppKitBridgeEventPayload;
  const v = p.values ?? {};
  return {
    name: name as StepName,
    state: v.state ?? "success",
    txHash: v.txHash,
    explorerUrl: v.explorerUrl,
    errorMessage: v.errorMessage ?? v.error?.message,
    errorCategory: v.errorCategory,
    forwarded: v.forwarded,
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
  const steps: Step[] = (raw.steps ?? []).map((s: BridgeStep) =>
    stepFromBridgeStep(s),
  );
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
  const message =
    errorStep?.errorMessage ?? "Bridge failed without a step error.";
  return {
    kind: "failure",
    // App Kit 1.4.2+ surfaces `errorCategory` on the failing step; we
    // pass it through so `toWhiskError` picks the right typed subclass
    // (UserRejectedError, OnchainRevertError, WalletCapabilityError, …)
    // instead of falling back to regex string-matching.
    error: toWhiskError(message, undefined, errorStep?.errorCategory),
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
  // App Kit's `BridgeStep.errorCategory` is typed in the SDK but we
  // read it loosely to keep our Step type independent of any specific
  // SDK version.
  const rawCategory = (
    s as unknown as { errorCategory?: Step["errorCategory"] }
  ).errorCategory;
  return {
    name: s.name as StepName,
    state: s.state,
    txHash: s.txHash,
    explorerUrl: s.explorerUrl ?? dataExplorer,
    errorMessage: s.errorMessage,
    errorCategory: rawCategory,
    forwarded: s.forwarded,
  };
}
