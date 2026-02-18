import * as v from "valibot";

/** EVM address: 0x followed by 40 hex characters */
export const EvmAddressSchema = v.pipe(
  v.string(),
  v.regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address")
);

/** Solana address: base58, 32-44 characters */
export const SolanaAddressSchema = v.pipe(
  v.string(),
  v.regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address")
);

/** Token target: chainId + address */
export const TokenTargetSchema = v.object({
  chainId: v.pipe(v.number(), v.integer(), v.minValue(1)),
  address: v.string(),
});

/** Amount: positive numeric string */
export const AmountSchema = v.pipe(
  v.string(),
  v.regex(/^\d+\.?\d*$/, "Invalid amount format"),
  v.check((val) => parseFloat(val) > 0, "Amount must be greater than zero")
);

/** Swap configuration validation */
export const SwapConfigSchema = v.object({
  apiEndpoint: v.optional(v.pipe(v.string(), v.url())),
  theme: v.optional(v.picklist(["light", "dark", "auto"])),
  locale: v.optional(v.string()),
  slippage: v.optional(
    v.pipe(v.number(), v.minValue(1), v.maxValue(5000))
  ),
  customColors: v.optional(v.record(v.string(), v.string())),
  fromToken: v.optional(v.union([v.string(), TokenTargetSchema])),
  toToken: v.optional(v.union([v.string(), TokenTargetSchema])),
  callbacks: v.optional(v.object({
    onSwapSuccess: v.optional(v.function()),
    onSwapError: v.optional(v.function()),
    onWalletConnected: v.optional(v.function()),
    onQuoteReceived: v.optional(v.function()),
    onAmountChanged: v.optional(v.function()),
  })),
});

/** Receive configuration validation */
export const ReceiveConfigSchema = v.object({
  apiEndpoint: v.optional(v.pipe(v.string(), v.url())),
  theme: v.optional(v.picklist(["light", "dark", "auto"])),
  locale: v.optional(v.string()),
  slippage: v.optional(
    v.pipe(v.number(), v.minValue(1), v.maxValue(5000))
  ),
  customColors: v.optional(v.record(v.string(), v.string())),
  target: v.union([v.string(), TokenTargetSchema]),
  amount: AmountSchema,
  fromToken: v.optional(v.union([v.string(), TokenTargetSchema])),
  icon: v.optional(v.string()),
  callbacks: v.optional(v.object({
    onSwapSuccess: v.optional(v.function()),
    onSwapError: v.optional(v.function()),
    onWalletConnected: v.optional(v.function()),
    onQuoteReceived: v.optional(v.function()),
    onAmountChanged: v.optional(v.function()),
  })),
});

/** Quote response validation — matches Hyperstream API structure */
export const QuoteResponseSchema = v.object({
  quoteId: v.string(),
  routes: v.array(
    v.object({
      routeId: v.string(),
      type: v.string(),
      icon: v.optional(v.string()),
      exactOutMethod: v.optional(v.picklist(["native", "adaptive"])),
      tags: v.optional(v.array(v.string())),
      quote: v.object({
        amountIn: v.string(),
        amountOut: v.string(),
        minAmountOut: v.optional(v.string()),
        slippageTolerance: v.optional(v.number()),
        expectedDurationSeconds: v.number(),
        validBefore: v.number(),
        estimatedGas: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      }),
    })
  ),
});
