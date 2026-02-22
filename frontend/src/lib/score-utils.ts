export type ScoreScale = "0-1" | "0-100" | "1-5" | "percentage";

export interface FormattedScore {
  display: string;
  percent: number | null;
  scaleLabel: string;
  raw: number | null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatScore(value: unknown, scale: ScoreScale): FormattedScore {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return { display: "-", percent: null, scaleLabel: scale, raw: null };
  }

  if (scale === "0-1") {
    const percent = clamp(numeric * 100, 0, 100);
    return { display: numeric.toFixed(2), percent, scaleLabel: "0-1", raw: numeric };
  }

  if (scale === "1-5") {
    const percent = clamp(((numeric - 1) / 4) * 100, 0, 100);
    return { display: numeric.toFixed(2), percent, scaleLabel: "1-5", raw: numeric };
  }

  if (scale === "percentage") {
    const percent = clamp(numeric, 0, 100);
    return { display: `${numeric.toFixed(1)}%`, percent, scaleLabel: "0-100%", raw: numeric };
  }

  const percent = clamp(numeric, 0, 100);
  return { display: numeric.toFixed(1), percent, scaleLabel: "0-100", raw: numeric };
}
