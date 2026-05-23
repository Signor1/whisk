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

export function createWhisk(config: WhiskConfig): WhiskEngine {
  if (!config.chains || config.chains.length === 0) {
    throw new ConfigError("createWhisk: at least one chain is required.");
  }

  const resolvedMode = resolveMode(config.mode, config.chains);
  const resolvedConfig: WhiskConfig = { ...config, mode: resolvedMode };

  // Opt out of App Kit 1.5.0's default-on error telemetry POSTs.
  const kit = new AppKit({ disableErrorReporting: true });
  const defaultToken = resolvedConfig.token ?? DEFAULT_TOKEN;
  const resolver = resolvedConfig.resolver ?? addressResolver;

  const engine: WhiskEngine = {
    config: resolvedConfig,

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

    async quote(params: QuoteParams): Promise<Quote> {
      const route = decideRoute(params.sourceChain, params.destinationChain);
      const adapter = params.adapter.appKitAdapter;
      // Bridge is USDC-only; same-chain sends honour the user's token choice.
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
          estimatedDurationMs: 30_000,
        };
      } catch (err) {
        throw toWhiskError(err, "Quote failed");
      }
    },

    async send(params: SendParams, listeners?: SendListeners) {
      return runSend(kit, resolvedConfig, params, listeners);
    },

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

    async estimateSwap(params: SwapParams): Promise<SwapEstimate> {
      try {
        const appKitParams = buildAppKitSwapParams(params);
        const estimate = await kit.estimateSwap(appKitParams);
        return mapAppKitSwapEstimate(estimate, params);
      } catch (err) {
        throw toWhiskError(err, "Swap estimate failed");
      }
    },

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

// App Kit adapters are ecosystem-scoped (Viem rejects Solana chains and vice versa).
// Cross-ecosystem hops must use the forwarder; same-ecosystem hops can opt in via config.
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

  return {
    from: { adapter, chain: sourceChain },
    to: { chain: destinationChain, recipientAddress, useForwarder: true },
    amount,
  } as BridgeParams;
}

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

type BridgeAction = "approve" | "burn" | "fetchAttestation" | "mint";
const BRIDGE_ACTIONS: ReadonlyArray<BridgeAction> = [
  "approve",
  "burn",
  "fetchAttestation",
  "mint",
];

async function runSend(
  kit: AppKit,
  config: WhiskConfig,
  params: SendParams,
  listeners?: SendListeners,
): Promise<SendResult> {
  const route = params.quote.route;
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

// Events fire once the step lands — read state off `payload.values` (never default to pending).
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
  // Read errorCategory loosely to decouple from App Kit's SDK version.
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
