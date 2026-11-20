import { toFils } from "@/lib/money";
import type { PricingTier, ProductWithRelations } from "@/types";

import { MAX_BUNDLES, MIN_BUNDLES } from "@/features/catalog/lib/bundles";

/**
 * One cart line = one pricing tier (bundle offer) and how many bundles of it.
 * The line is keyed by tierId, so two offers of the same product are two lines.
 * Prices are never stored here: they are read from the live catalog on every render,
 * so a price changed in the admin panel shows up in the cart.
 */
export type CartLine = {
  tierId: string;
  bundles: number;
};

export function isValidBundles(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= MIN_BUNDLES && n <= MAX_BUNDLES;
}

function assertBundles(n: number): void {
  if (!isValidBundles(n)) {
    throw new RangeError(
      `Bundles must be a whole number from ${MIN_BUNDLES} to ${MAX_BUNDLES}, got ${n}`,
    );
  }
}

/** Adds `bundles` of a tier. Same tier again → more bundles on the same line (capped at MAX_BUNDLES). */
export function addLine(lines: readonly CartLine[], tierId: string, bundles = 1): CartLine[] {
  assertBundles(bundles);
  const existing = lines.find((l) => l.tierId === tierId);
  if (!existing) return [...lines, { tierId, bundles }];
  return lines.map((l) =>
    l.tierId === tierId ? { ...l, bundles: Math.min(MAX_BUNDLES, l.bundles + bundles) } : l,
  );
}

/** Sets the bundle count of an existing line. Removal is a separate, explicit action. */
export function setLineBundles(
  lines: readonly CartLine[],
  tierId: string,
  bundles: number,
): CartLine[] {
  assertBundles(bundles);
  return lines.map((l) => (l.tierId === tierId ? { ...l, bundles } : l));
}

export function removeLine(lines: readonly CartLine[], tierId: string): CartLine[] {
  return lines.filter((l) => l.tierId !== tierId);
}

/** Keeps only well-formed lines (used when reading untrusted data from localStorage). */
export function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: CartLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { tierId, bundles } = item as Record<string, unknown>;
    if (typeof tierId !== "string" || tierId === "" || seen.has(tierId) || !isValidBundles(bundles))
      continue;
    seen.add(tierId);
    out.push({ tierId, bundles });
  }
  return out;
}

export type ResolvedCartItem = {
  line: CartLine;
  product: ProductWithRelations;
  tier: PricingTier;
  bundleFils: number;
  /** bundle price × bundles */
  lineTotalFils: number;
  /** internal pack quantity: units per bundle × bundles */
  linePacks: number;
};

export type ResolvedCart = {
  items: ResolvedCartItem[];
  /** Lines whose tier no longer exists in the catalog (deleted in the admin panel). */
  missingTierIds: string[];
  subtotalFils: number;
  totalBundles: number;
  totalPacks: number;
};

/** Joins cart lines with the live catalog and computes every total in integer fils. */
export function resolveCart(
  lines: readonly CartLine[],
  products: readonly ProductWithRelations[],
): ResolvedCart {
  const byTier = new Map<string, { product: ProductWithRelations; tier: PricingTier }>();
  for (const product of products) {
    for (const tier of product.pricing_tiers) byTier.set(tier.id, { product, tier });
  }

  const items: ResolvedCartItem[] = [];
  const missingTierIds: string[] = [];
  let subtotalFils = 0;
  let totalBundles = 0;
  let totalPacks = 0;

  for (const line of lines) {
    const match = byTier.get(line.tierId);
    if (!match) {
      missingTierIds.push(line.tierId);
      continue;
    }
    const bundleFils = toFils(match.tier.bundle_price);
    const lineTotalFils = bundleFils * line.bundles;
    const linePacks = match.tier.units_per_bundle * line.bundles;
    items.push({ line, ...match, bundleFils, lineTotalFils, linePacks });
    subtotalFils += lineTotalFils;
    totalBundles += line.bundles;
    totalPacks += linePacks;
  }

  return { items, missingTierIds, subtotalFils, totalBundles, totalPacks };
}
