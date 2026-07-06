// ABI of the confidential ERC-20 wrapper (OpenZeppelin ERC7984ERC20Wrapper,
// deployed on Sepolia as ConfidentialWrapperV3). Every euint64 / externalEuint64
// is a bytes32 ciphertext handle on the wire; every inputProof / decryptionProof
// is bytes. viem treats handles as 0x-prefixed 32-byte hex.
//
// Verified against the deployed implementation 0x390aA02fb7eba565bfcfc43f67db7e4d05c1d0ee
// (Sourcify verified match, chain 11155111) and OpenZeppelin source.
// sourceRef: https://github.com/OpenZeppelin/openzeppelin-confidential-contracts
//   contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol
//
// Wrap: approve(WRAPPER, amount) on the underlying ERC-20, then wrap(to, amount).
// Unwrap is a two-transaction flow: unwrap(...) emits UnwrapRequested, then after a
// public decryption of the amount handle, finalizeUnwrap(...) releases the ERC-20.
export const CONFIDENTIAL_WRAPPER_ABI = [
  // ---- Wrap (ERC-20 -> confidential) ----
  {
    type: "function",
    name: "wrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    // returns the euint64 handle of the minted confidential amount
    outputs: [{ name: "", type: "bytes32" }],
  },

  // ---- Unwrap (confidential -> ERC-20), with input proof (partial amounts) ----
  {
    type: "function",
    name: "unwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      // externalEuint64 handle produced by createEncryptedInput().encrypt()
      { name: "encryptedAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  // ---- Unwrap without input proof (caller must be ACL-allowed for the handle;
  //      used for full-balance unwrap passing confidentialBalanceOf(user)) ----
  {
    type: "function",
    name: "unwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "bytes32" }, // euint64 handle
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  // ---- Finalize unwrap (second transaction): releases the underlying ERC-20 ----
  {
    type: "function",
    name: "finalizeUnwrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "unwrapRequestId", type: "bytes32" },
      { name: "unwrapAmountCleartext", type: "uint64" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
  },

  // ---- Reads ----
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }], // euint64 handle
  },
  {
    type: "function",
    name: "confidentialTotalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }], // euint64 handle
  },
  {
    type: "function",
    name: "unwrapAmount",
    stateMutability: "view",
    inputs: [{ name: "unwrapRequestId", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }], // euint64 handle of the pending unwrap
  },
  {
    type: "function",
    name: "unwrapRequester",
    stateMutability: "view",
    inputs: [{ name: "unwrapRequestId", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "rate",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "underlying",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },

  // ---- Operator management (unwrap/transfer on behalf of a holder) ----
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" }, // unix timestamp expiry
    ],
    outputs: [],
  },

  // ---- Events ----
  {
    type: "event",
    name: "Wrap",
    anonymous: false,
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "roundedAmount", type: "uint256", indexed: false },
      { name: "encryptedWrappedAmount", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UnwrapRequested",
    anonymous: false,
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "bytes32", indexed: true },
      { name: "amount", type: "bytes32", indexed: false }, // euint64 handle
    ],
  },
  {
    type: "event",
    name: "UnwrapFinalized",
    anonymous: false,
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "unwrapRequestId", type: "bytes32", indexed: true },
      { name: "encryptedAmount", type: "bytes32", indexed: false },
      { name: "cleartextAmount", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OperatorSet",
    anonymous: false,
    inputs: [
      { name: "holder", type: "address", indexed: true },
      { name: "operator", type: "address", indexed: true },
      { name: "until", type: "uint48", indexed: false },
    ],
  },
] as const;
