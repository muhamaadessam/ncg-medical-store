import { describe, expect, it } from "vitest";

import { formatKWD } from "@/lib/money";
import type { ProductWithRelations } from "@/types";

import {
  addLine,
  removeLine,
  resolveCart,
  sanitizeLines,
  setLineBundles,
  type CartLine,
} from "../cartMath";

const tier = (id: string, label: string, units: number, price: number, sort = 0) => ({
  id,
  product_id: "c",
  label,
  units_per_bundle: units,
  bundle_price: price,
  sort_order: sort,
});

// Product C from the brief: 1 / 4 / 12 packs at 5.500 / 19.500 / 55.000 KWD.
const productC = {
  id: "c",
  name: "Vitamin D3",
  description: null,
  images: [],
  brand_id: "b",
  category_id: "k",
  created_at: "",
  updated_at: "",
  brand: { id: "b", name: "MediCare", created_at: "" },
  category: { id: "k", name: "Vitamins", created_at: "" },
  pricing_tiers: [
    tier("c1", "1 Pack", 1, 5.5, 0),
    tier("c4", "4 Packs", 4, 19.5, 1),
    tier("c12", "12 Packs", 12, 55, 2),
  ],
} as unknown as ProductWithRelations;

describe("cart lines", () => {
  it("brief example: 2 × 4-pack offer = 8 packs = 39.000 KWD", () => {
    const lines = addLine([], "c4", 2);
    const cart = resolveCart(lines, [productC]);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.linePacks).toBe(8);
    expect(formatKWD(cart.items[0]!.lineTotalFils)).toBe("39.000 KWD");
    expect(formatKWD(cart.subtotalFils)).toBe("39.000 KWD");
  });

  it("uses the bundle price as a total, never as a per-pack price", () => {
    const cart = resolveCart([{ tierId: "c4", bundles: 2 }], [productC]);
    // 8 packs × 19.500 would be 156.000 — that must never happen.
    expect(cart.subtotalFils).toBe(39_000);
  });

  it("keeps different offers of the same product as separate lines", () => {
    let lines: CartLine[] = addLine([], "c1");
    lines = addLine(lines, "c4");
    expect(lines).toEqual([
      { tierId: "c1", bundles: 1 },
      { tierId: "c4", bundles: 1 },
    ]);
  });

  it("adds to the existing line when the same offer is added again", () => {
    let lines = addLine([], "c4");
    lines = addLine(lines, "c4");
    expect(lines).toEqual([{ tierId: "c4", bundles: 2 }]);
  });

  it("caps a line at 99 bundles when adding more", () => {
    const lines = addLine([{ tierId: "c4", bundles: 98 }], "c4", 5);
    expect(lines[0]!.bundles).toBe(99);
  });

  it("totals all three offers of Product C: 99.500 KWD and 21 packs", () => {
    const lines: CartLine[] = [
      { tierId: "c1", bundles: 1 },
      { tierId: "c4", bundles: 2 },
      { tierId: "c12", bundles: 1 },
    ];
    const cart = resolveCart(lines, [productC]);
    expect(formatKWD(cart.subtotalFils)).toBe("99.500 KWD");
    expect(cart.totalPacks).toBe(21);
    expect(cart.totalBundles).toBe(4);
  });

  it("updates and removes lines", () => {
    let lines: CartLine[] = [{ tierId: "c1", bundles: 1 }];
    lines = setLineBundles(lines, "c1", 3);
    expect(lines[0]!.bundles).toBe(3);
    expect(removeLine(lines, "c1")).toEqual([]);
  });

  it.each([0, -1, 1.5, Number.NaN, 100])("rejects invalid bundle count %s", (n) => {
    expect(() => addLine([], "c1", n)).toThrow(RangeError);
    expect(() => setLineBundles([{ tierId: "c1", bundles: 1 }], "c1", n)).toThrow(RangeError);
  });

  it("reports lines whose offer was deleted and leaves them out of the totals", () => {
    const cart = resolveCart(
      [
        { tierId: "deleted", bundles: 3 },
        { tierId: "c1", bundles: 1 },
      ],
      [productC],
    );
    expect(cart.missingTierIds).toEqual(["deleted"]);
    expect(cart.subtotalFils).toBe(5_500);
  });

  it("reads back only valid lines from storage", () => {
    expect(
      sanitizeLines([
        { tierId: "c1", bundles: 2 },
        { tierId: "c1", bundles: 4 }, // duplicate
        { tierId: "c4", bundles: 0 },
        { tierId: "c12", bundles: "3" },
        null,
        "junk",
      ]),
    ).toEqual([{ tierId: "c1", bundles: 2 }]);
    expect(sanitizeLines("not an array")).toEqual([]);
  });
});
