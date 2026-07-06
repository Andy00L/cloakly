// Public faucet mint on the underlying ERC20Mock test tokens. Anyone can mint up to
// 1,000,000 tokens (scaled by the token's decimals) per call; there is no access
// control, and it is repeatable. Standard ERC-20 reads/approve use viem's built-in
// erc20Abi; only this mock-specific mint is declared here.
// sourceRef: verified ERC20Mock source on Sepolia Etherscan
//   (e.g. 0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF#code); selector 0x40c10f19.
export const ERC20_MOCK_MINT_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// Per-call mint cap in whole tokens (before scaling by decimals).
// sourceRef: ERC20Mock MAX_MINT_AMOUNT_TOKENS constant.
export const ERC20_MOCK_MAX_MINT_TOKENS = 1_000_000n;
