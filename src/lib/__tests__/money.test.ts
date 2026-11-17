import { describe, expect, it } from "vitest";

import { formatKWD, toFils } from "@/lib/money";

describe("toFils", () => {
  it("converts KWD numbers to integer fils (1 KWD = 1000 fils)", () => {
    expect(toFils(3.75)).toBe(3750);
    expect(toFils(19.5)).toBe(19500);
    expect(toFils(55)).toBe(55000);
  });

  it("accepts numeric strings as returned by Postgres numeric(10,3)", () => {
    expect(toFils("1.250")).toBe(1250);
    expect(toFils("17.000")).toBe(17000);
  });

  it("rounds away float noise instead of truncating", () => {
    // 1.255 * 1000 === 1254.9999999999998 in IEEE-754
    expect(toFils(1.255)).toBe(1255);
    expect(toFils(0.1 + 0.2)).toBe(300);
  });

  it("rejects non-numeric input", () => {
    expect(() => toFils("abc")).toThrow();
  });
});

describe("formatKWD", () => {
  it("always shows exactly 3 decimals", () => {
    expect(formatKWD(19500)).toBe("19.500 KWD");
    expect(formatKWD(3750)).toBe("3.750 KWD");
    expect(formatKWD(55000)).toBe("55.000 KWD");
    expect(formatKWD(5)).toBe("0.005 KWD");
    expect(formatKWD(0)).toBe("0.000 KWD");
  });

  it("rejects non-integer fils so floats never reach display", () => {
    expect(() => formatKWD(19.5)).toThrow();
  });
});

describe("bundle pricing", () => {
  it("treats bundle_price as the total for the whole bundle, not per unit", () => {
    // Vitamin D3: 4 Packs = 19.500 KWD total; two bundles cost 39.000 KWD.
    const bundleFils = toFils("19.500");
    expect(formatKWD(bundleFils * 2)).toBe("39.000 KWD");
  });
});
