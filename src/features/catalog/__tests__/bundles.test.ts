import { describe, expect, it } from "vitest";

import { correctBundlesInput, MAX_BUNDLES, MIN_BUNDLES } from "@/features/catalog/lib/bundles";
import { bundleSummary } from "@/features/catalog/lib/pricing";
import { formatKWD } from "@/lib/money";

describe("bundleSummary", () => {
  it("multiplies the bundle price by the number of bundles, not by packs", () => {
    const tier = { units_per_bundle: 4, bundle_price: 19.5 };
    const { totalFils, totalPacks } = bundleSummary(tier, 2);
    expect(formatKWD(totalFils)).toBe("39.000 KWD");
    expect(totalPacks).toBe(8);
  });

  it("rejects non-integer or zero bundle counts", () => {
    const tier = { units_per_bundle: 1, bundle_price: 3.75 };
    expect(() => bundleSummary(tier, 0)).toThrow();
    expect(() => bundleSummary(tier, 1.5)).toThrow();
  });
});

describe("correctBundlesInput", () => {
  it("allows 1 to 99", () => {
    expect(MIN_BUNDLES).toBe(1);
    expect(MAX_BUNDLES).toBe(99);
    expect(correctBundlesInput("1", 5)).toMatchObject({ bundles: 1, hint: null });
    expect(correctBundlesInput("99", 5)).toMatchObject({ bundles: 99, hint: null });
  });

  it("corrects 0 and negatives up to 1", () => {
    expect(correctBundlesInput("0", 5)).toMatchObject({ bundles: 1, draft: "1" });
    expect(correctBundlesInput("-3", 5)).toMatchObject({ bundles: 1, draft: "1" });
    expect(correctBundlesInput("0", 5).hint).not.toBeNull();
  });

  it("caps values above 99", () => {
    expect(correctBundlesInput("150", 5)).toMatchObject({ bundles: 99, draft: "99" });
  });

  it("drops decimals to a whole bundle", () => {
    expect(correctBundlesInput("2.5", 1)).toMatchObject({ bundles: 2, draft: "2" });
    expect(correctBundlesInput("2.5", 1).hint).not.toBeNull();
  });

  it("keeps the last valid count for text", () => {
    expect(correctBundlesInput("abc", 7)).toMatchObject({ bundles: 7, draft: "7" });
    expect(correctBundlesInput("abc", 7).hint).not.toBeNull();
  });

  it("allows an empty box while typing without changing the count", () => {
    expect(correctBundlesInput("", 4)).toMatchObject({ bundles: 4, draft: "" });
  });
});
