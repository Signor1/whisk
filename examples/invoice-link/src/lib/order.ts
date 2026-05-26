export function makeInvoiceNonce(seed: string): string {
  const hash = Math.abs(
    seed.split("").reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7),
  );
  return String(hash % 10000).padStart(4, "0");
}

export function explorerUrl(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

export function shortTxHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
}
