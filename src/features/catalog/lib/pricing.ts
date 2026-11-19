import { toFils } from "@/lib/money";
import type { PricingTier } from "@/types";

type TierPrice = Pick<PricingTier, "bundle_price" | "units_per_bundle">;

/** Bundle total and per-pack price of one tier, both in integer fils. */
export function tierPricing(tier: TierPrice) {
  const bundleFils = toFils(tier.bundle_price);
  // Display-only rounding to the nearest fils; comparisons use exact cross-multiplication.
  const perPackFils = Math.round(bundleFils / tier.units_per_bundle);
  return { bundleFils, perPackFils };
}

/**
 * Order line for N bundles of one tier, in integer fils.
 * total = bundle_price × bundles (never × packs); totalPacks = units_per_bundle × bundles.
 */
export function bundleSummary(tier: TierPrice, bundles: number) {
  if (!Number.isInteger(bundles) || bundles < 1) {
    throw new Error(`bundles must be a positive integer, got ${bundles}`);
  }
  const { bundleFils } = tierPricing(tier);
  return {
    totalFils: bundleFils * bundles,
    totalPacks: tier.units_per_bundle * bundles,
  };
}

/** "1 pack" / "4 packs" */
export function packsLabel(units: number): string {
  return `${units} ${units === 1 ? "pack" : "packs"}`;
}

/**
 * Id of the tier with the lowest price per pack, or null when there is nothing
 * to compare (fewer than 2 tiers, or every tier costs the same per pack).
 * Compares bundleA / unitsA < bundleB / unitsB as bundleA * unitsB < bundleB * unitsA
 * on integer fils, so no division or float rounding is involved. Ties keep the earlier tier.
 */
export function findBestValueTierId(
  tiers: ReadonlyArray<TierPrice & Pick<PricingTier, "id">>,
): string | null {
  const [first, ...rest] = tiers;
  if (!first || rest.length === 0) return null;

  let best = first;
  let bestFils = toFils(best.bundle_price);
  for (const tier of rest) {
    const fils = toFils(tier.bundle_price);
    if (fils * best.units_per_bundle < bestFils * tier.units_per_bundle) {
      best = tier;
      bestFils = fils;
    }
  }

  const allSamePerPack = tiers.every(
    (t) => toFils(t.bundle_price) * best.units_per_bundle === bestFils * t.units_per_bundle,
  );
  return allSamePerPack ? null : best.id;
}
