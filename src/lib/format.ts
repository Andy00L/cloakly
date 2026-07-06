import { formatUnits } from "viem";

// Formats a base-unit token amount for display: full value, trailing zeros trimmed,
// thousands separators on the integer part. String math throughout so large bigint
// values never lose precision through Number().
export function formatTokenAmount(value: bigint, decimals: number): string {
  const raw = formatUnits(value, decimals);
  const [whole, fraction = ""] = raw.split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
}

// Abbreviates an address for compact display, e.g. 0x1234...aBcd.
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
