// Minimal EIP-1193 provider shape for the injected wallet (MetaMask and compatible),
// enough to hand to the relayer SDK's createInstance({ network }). Declared here so
// window.ethereum is typed without pulling in ethers just for its provider type.

interface InjectedEip1193Provider {
  request(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

interface Window {
  ethereum?: InjectedEip1193Provider;
}
