// ABI of the Zama Wrappers Registry: the onchain directory mapping each ERC-20
// to its confidential ERC-7984 wrapper. Only the read surface plus the two
// registration events are included; the registry is read-only for this app.
//
// A pair is stored as a struct: { address tokenAddress, address
// confidentialTokenAddress, bool isValid }. `isValid` is false once the Protocol
// DAO revokes a wrapper, so pairs must be validity-checked before use.
//
// sourceRef: https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry
// Note: signatures verified against the docs; return decoding depends only on the
// tuple layout (address, address, bool), which the registry reader relies on.
export const WRAPPERS_REGISTRY_ABI = [
  {
    type: "function",
    name: "getTokenConfidentialTokenPairs",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPair",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTokenConfidentialTokenPairsSlice",
    stateMutability: "view",
    // fromIndex inclusive, toIndex exclusive.
    inputs: [
      { name: "fromIndex", type: "uint256" },
      { name: "toIndex", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getConfidentialTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialToken", type: "address" },
    ],
  },
  {
    type: "function",
    name: "getTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "confidentialToken", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "token", type: "address" },
    ],
  },
  {
    type: "function",
    name: "isConfidentialTokenValid",
    stateMutability: "view",
    inputs: [{ name: "confidentialToken", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getTokenIndex",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "ConfidentialTokenRegistered",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: false },
      { name: "confidentialTokenAddress", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ConfidentialTokenRevoked",
    inputs: [
      { name: "tokenAddress", type: "address", indexed: false },
      { name: "confidentialTokenAddress", type: "address", indexed: false },
    ],
  },
] as const;
