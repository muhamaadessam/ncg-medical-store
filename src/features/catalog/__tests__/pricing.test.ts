import { describe, expect, it } from "vitest";

import { findBestValueTierId, packsLabel, tierPricing } from "@/features/catalog/lib/pricing";
import { formatKWD } from "@/lib/money";

const tier = (id: string, units: number, price: number) => ({
  id,
  units_per_bundle: units,
  bundle_price: price,
});

describe("tierPricing", () => {
  it("treats bundle_price as the bundle total and derives price per pack", () => {
    const { bundleFils, perPackFils } = tierPricing(tier("c4", 4, 19.5));
    expect(formatKWD(bundleFils)).toBe("19.500 KWD");
    expect(formatKWD(perPackFils)).toBe("4.875 KWD");
  });

  it("rounds per-pack prices to the nearest fils for display", () => {
    expect(tierPricing(tier("d3", 3, 17)).perPackFils).toBe(5667);
    expect(tierPricing(tier("c12", 12, 55)).perPackFils).toBe(4583);
  });
});

describe("packsLabel", () => {
  it("pluralises pack counts", () => {
    expect(packsLabel(1)).toBe("1 pack");
    expect(packsLabel(4)).toBe("4 packs");
  });
});

describe("findBestValueTierId", () => {
  it("returns null for a single tier (nothing to compare)", () => {
    expect(findBestValueTierId([tier("a1", 1, 3.75)])).toBeNull();
  });

  it("picks the lowest price per pack across any number of tiers", () => {
    // Vitamin D3: 5.500 / 4.875 / 4.583 per pack
    expect(
      findBestValueTierId([tier("c1", 1, 5.5), tier("c4", 4, 19.5), tier("c12", 12, 55)]),
    ).toBe("c12");
    // Gauze: 1.250 vs 1.125 per pack
    expect(findBestValueTierId([tier("b1", 1, 1.25), tier("b4", 4, 4.5)])).toBe("b4");
  });

  it("does not depend on tier order", () => {
    expect(findBestValueTierId([tier("d3", 3, 17), tier("d1", 1, 6.25)])).toBe("d3");
  });

  it("returns null when every tier costs the same per pack", () => {
    expect(findBestValueTierId([tier("x1", 1, 2), tier("x2", 2, 4)])).toBeNull();
  });
});
