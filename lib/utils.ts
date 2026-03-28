export function shortAddress(address?: string | null) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function safeAtob(input: string) {
  if (typeof window === "undefined") {
    return Buffer.from(input, "base64").toString("utf-8");
  }
  return atob(input);
}

export function parseDataTokenUri(tokenUri: string) {
  if (!tokenUri.startsWith("data:application/json;base64,")) return null;
  const encoded = tokenUri.replace("data:application/json;base64,", "");
  try {
    const raw = safeAtob(encoded);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function formatBalance(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}
