export function formatDateFromUnix(seconds: bigint): string {
  return new Date(Number(seconds) * 1000).toLocaleString();
}

export function shortAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatSignedBps(bps: bigint): string {
  const asNumber = Number(bps);
  const sign = asNumber > 0 ? "+" : "";
  return `${sign}${(asNumber / 100).toFixed(2)}%`;
}
