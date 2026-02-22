export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function formatNumber(value?: number | null, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 1),
  });
}

export function safeArray<T = any>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function formatSentiment(value?: string | null) {
  if (!value) return "-";
  const normalized = value.replace(/_/g, " ").toLowerCase().trim();
  if (!normalized) return "-";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function asDateTs(value?: string | null) {
  if (!value) return null;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  // Fallback for M/D/YY and M/D/YYYY strings.
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value.trim());
  if (!mdy) return null;
  const month = Number(mdy[1]);
  const day = Number(mdy[2]);
  const year = mdy[3].length === 2 ? Number(`20${mdy[3]}`) : Number(mdy[3]);
  const ts = new Date(year, month - 1, day).getTime();
  return Number.isNaN(ts) ? null : ts;
}

export function parseAmount(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}
