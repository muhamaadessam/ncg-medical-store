export const MIN_BUNDLES = 1;
export const MAX_BUNDLES = 99;

export type BundlesInputResult = {
  /** Valid bundle count to use (always an integer in [MIN_BUNDLES, MAX_BUNDLES]). */
  bundles: number;
  /** What the input box should show now. */
  draft: string;
  /** Inline hint explaining a correction, or null when the input was valid. */
  hint: string | null;
};

export function clampBundles(n: number): number {
  if (!Number.isFinite(n)) return MIN_BUNDLES;
  return Math.min(MAX_BUNDLES, Math.max(MIN_BUNDLES, Math.trunc(n)));
}

/**
 * Turns whatever was typed into the bundle box into a valid count.
 * Empty input is allowed while typing (the last valid count stays in use);
 * 0, negatives, decimals, too-large numbers and text are corrected with a hint.
 */
export function correctBundlesInput(raw: string, current: number): BundlesInputResult {
  const text = raw.trim();
  const keep = clampBundles(current);

  if (text === "") {
    return { bundles: keep, draft: "", hint: `Enter a number from ${MIN_BUNDLES} to ${MAX_BUNDLES}` };
  }

  if (/^\d+$/.test(text)) {
    const n = Number(text);
    if (n < MIN_BUNDLES) {
      return { bundles: MIN_BUNDLES, draft: String(MIN_BUNDLES), hint: `Minimum is ${MIN_BUNDLES} bundle` };
    }
    if (n > MAX_BUNDLES) {
      return { bundles: MAX_BUNDLES, draft: String(MAX_BUNDLES), hint: `Maximum is ${MAX_BUNDLES} bundles` };
    }
    return { bundles: n, draft: String(n), hint: null };
  }

  const numeric = Number(text.replace(",", "."));
  if (Number.isFinite(numeric)) {
    if (numeric < MIN_BUNDLES) {
      return { bundles: MIN_BUNDLES, draft: String(MIN_BUNDLES), hint: `Minimum is ${MIN_BUNDLES} bundle` };
    }
    const fixed = clampBundles(numeric);
    return { bundles: fixed, draft: String(fixed), hint: "Whole bundles only" };
  }

  return { bundles: keep, draft: String(keep), hint: "Numbers only" };
}
