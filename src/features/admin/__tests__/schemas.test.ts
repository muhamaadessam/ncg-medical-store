import { describe, expect, it } from "vitest";

import { kwdPriceSchema, productInputSchema, taxonomyNameSchema } from "../schemas";

const BRAND = "11111111-1111-1111-1111-111111111101";
const CATEGORY = "22222222-2222-2222-2222-222222222201";

const valid = {
  name: "Vitamin D3",
  description: "",
  brand_id: BRAND,
  category_id: CATEGORY,
  images: ["https://example.com/a.jpg"],
  tiers: [
    { label: "1 Pack", units_per_bundle: 1, bundle_price: "5.500" },
    { label: "4 Packs", units_per_bundle: "4", bundle_price: "19.5" },
    { label: "12 Packs", units_per_bundle: 12, bundle_price: 55 },
  ],
};

const messages = (input: unknown) => {
  const result = productInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("product schema", () => {
  it("accepts any number of tiers with whole units and KWD prices", () => {
    const parsed = productInputSchema.parse(valid);
    expect(parsed.tiers.map((t) => t.units_per_bundle)).toEqual([1, 4, 12]);
    expect(parsed.tiers.map((t) => t.bundle_price)).toEqual(["5.500", "19.5", "55"]);
  });

  it("requires at least one tier", () => {
    expect(messages({ ...valid, tiers: [] })).toContain("Add at least one pricing tier");
  });

  it("rejects two tiers with the same bundle size", () => {
    const tiers = [valid.tiers[0], { label: "Single", units_per_bundle: 1, bundle_price: "6" }];
    expect(messages({ ...valid, tiers }).join()).toMatch(/different bundle size/);
  });

  it.each([0, -2, 1.5, "abc"])("rejects units %s", (units) => {
    const tiers = [{ label: "x", units_per_bundle: units, bundle_price: "1" }];
    expect(productInputSchema.safeParse({ ...valid, tiers }).success).toBe(false);
  });

  it("requires name, brand and category", () => {
    const errors = messages({ ...valid, name: "  ", brand_id: "", category_id: "" });
    expect(errors).toEqual(
      expect.arrayContaining(["Product name is required", "Choose a brand", "Choose a category"]),
    );
  });

  it("rejects image values that are not URLs", () => {
    expect(messages({ ...valid, images: ["not a url"] }).join()).toMatch(/valid image URL/);
  });
});

describe("KWD price", () => {
  it.each(["5.500", "19.5", "55", "0.001", 4.5])("accepts %s", (price) => {
    expect(kwdPriceSchema.safeParse(price).success).toBe(true);
  });

  it.each(["0", "0.000", "-1", "1.2345", "abc", ""])("rejects %s", (price) => {
    expect(kwdPriceSchema.safeParse(price).success).toBe(false);
  });
});

describe("brand / category name", () => {
  it("trims and requires a name", () => {
    expect(taxonomyNameSchema.parse({ name: "  MediCare " }).name).toBe("MediCare");
    expect(taxonomyNameSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});
