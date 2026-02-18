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

/** Quote response validation */
export const QuoteResponseSchema = v.object({
  quoteId: v.string(),
  fromToken: v.object({
    chainId: v.number(),
    address: v.string(),
    symbol: v.string(),
    name: v.string(),
    decimals: v.number(),
    logoURI: v.optional(v.string()),
  }),
  toToken: v.object({
    chainId: v.number(),
    address: v.string(),
    symbol: v.string(),
    name: v.string(),
    decimals: v.number(),
    logoURI: v.optional(v.string()),
  }),
  fromAmount: v.string(),
  toAmount: v.string(),
  exchangeRate: v.string(),
  estimatedFee: v.string(),
  estimatedTime: v.number(),
  routes: v.array(
    v.object({
      routeId: v.string(),
      provider: v.string(),
      estimatedOutput: v.string(),
      estimatedFee: v.string(),
      estimatedTime: v.number(),
      actions: v.array(
        v.object({
          type: v.string(),
          chainId: v.optional(v.number()),
          description: v.optional(v.string()),
        })
      ),
    })
  ),
});
