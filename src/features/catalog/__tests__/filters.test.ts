import { describe, expect, it } from "vitest";

import { facetCounts, filterProducts, parseCatalogSearch } from "@/features/catalog/lib/filters";

const MEDICARE = "brand-medicare";
const PHARMAPLUS = "brand-pharmaplus";
const VITAMINS = "cat-vitamins";
const FIRST_AID = "cat-first-aid";

const products = [
  { id: "thermometer", brand_id: MEDICARE, category_id: FIRST_AID },
  { id: "gauze", brand_id: PHARMAPLUS, category_id: FIRST_AID },
  { id: "vitamin-d3", brand_id: MEDICARE, category_id: VITAMINS },
  { id: "omega-3", brand_id: PHARMAPLUS, category_id: VITAMINS },
];

describe("parseCatalogSearch", () => {
  it("keeps brand and category ids from the query string", () => {
    expect(parseCatalogSearch({ brand: MEDICARE, category: VITAMINS })).toEqual({
      brand: MEDICARE,
      category: VITAMINS,
    });
  });

  it("drops empty, non-string and unknown params", () => {
    expect(parseCatalogSearch({ brand: "", category: 5, foo: "bar" })).toEqual({});
  });
});

describe("filterProducts", () => {
  it("shows everything when no filter is set", () => {
    expect(filterProducts(products, {})).toHaveLength(4);
  });

  it("combines brand AND category", () => {
    const result = filterProducts(products, { brand: MEDICARE, category: FIRST_AID });
    expect(result.map((p) => p.id)).toEqual(["thermometer"]);
  });

  it("filters by a single facet", () => {
    expect(filterProducts(products, { category: VITAMINS }).map((p) => p.id)).toEqual([
      "vitamin-d3",
      "omega-3",
    ]);
  });
});

describe("facetCounts", () => {
  it("counts every product per brand and category with no filters", () => {
    const counts = facetCounts(products, {});
    expect(counts.brands).toEqual({ [MEDICARE]: 2, [PHARMAPLUS]: 2 });
    expect(counts.categories).toEqual({ [FIRST_AID]: 2, [VITAMINS]: 2 });
    expect(counts.allBrands).toBe(4);
  });

  it("brand counts respect the selected category, category counts the selected brand", () => {
    const counts = facetCounts(products, { brand: MEDICARE, category: VITAMINS });
    expect(counts.brands).toEqual({ [MEDICARE]: 1, [PHARMAPLUS]: 1 });
    expect(counts.allBrands).toBe(2);
    expect(counts.categories).toEqual({ [FIRST_AID]: 1, [VITAMINS]: 1 });
    expect(counts.allCategories).toBe(2);
  });
});
