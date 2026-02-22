const EMPTY = "\u2014";

function compactSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function formatLabel(value?: string | null, empty = EMPTY) {
  if (!value) return empty;
  const normalized = compactSpaces(value.replace(/_/g, " "));
  if (!normalized) return empty;
  const lower = normalized.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

export function formatSentiment(value?: string | null, empty = EMPTY) {
  return formatLabel(value, empty);
}

export function formatTier(value?: string | null, empty = EMPTY) {
  if (!value) return empty;
  const normalized = compactSpaces(String(value).replace(/_/g, " ")).toUpperCase();
  if (/^P[0-2]$/.test(normalized)) return normalized;
  if (normalized === "NOT AVAILABLE" || normalized === "NOT_AVAILABLE") return "Not available";
  return formatLabel(normalized, empty);
}

export function formatNumber(value: unknown, decimals = 2, empty = EMPTY) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return empty;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
