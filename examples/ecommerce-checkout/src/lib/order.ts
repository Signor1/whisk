/** Order IDs are public-facing — keep them short and recognisable. */
export function makeOrderId(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 90000 + 10000);
  return `AH-${year}-${seq}`;
}

/** A tx hash is long; we want it scannable but not space-hogging. */
export function shortTxHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function explorerUrl(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}
