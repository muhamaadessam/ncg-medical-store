import { z } from "zod";

/**
 * Validation shared by the admin forms (client) and the admin server functions (server),
 * so the same rules apply in the browser and before anything reaches the database.
 */

const name = (what: string) =>
  z
    .string({ required_error: `${what} is required` })
    .trim()
    .min(1, `${what} is required`)
    .max(120, `${what} must be 120 characters or fewer`);

export const taxonomyKindSchema = z.enum(["brands", "categories"]);
export type TaxonomyKind = z.infer<typeof taxonomyKindSchema>;

export const taxonomyNameSchema = z.object({ name: name("Name") });

/** "19.5", "19.500" or 19.5 → validated KWD string with up to 3 decimals and > 0. */
export const kwdPriceSchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? String(v) : v.trim().replace(",", ".")))
  .refine((v) => v !== "", "Price is required")
  .refine(
    (v) => /^\d+(\.\d{1,3})?$/.test(v),
    "Use a positive amount with up to 3 decimals (e.g. 19.500)",
  )
  .refine((v) => Number(v) > 0, "Price must be greater than 0")
  .refine((v) => Number(v) <= 9_999_999.999, "Price is too large");

export const tierInputSchema = z.object({
  /** Existing tier id when editing; absent for a new tier. */
  id: z.string().uuid().optional(),
  label: name("Label"),
  units_per_bundle: z.coerce
    .number({ invalid_type_error: "Units must be a number" })
    .int("Units must be a whole number")
    .min(1, "Units must be at least 1")
    .max(10_000, "Units is too large"),
  bundle_price: kwdPriceSchema,
});
export type TierInput = z.input<typeof tierInputSchema>;

export const productInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: name("Product name"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer")
      .default(""),
    brand_id: z.string({ required_error: "Choose a brand" }).uuid("Choose a brand"),
    category_id: z.string({ required_error: "Choose a category" }).uuid("Choose a category"),
    images: z
      .array(z.string().trim().url("Enter a valid image URL (https://…)"))
      .max(8, "Up to 8 images")
      .default([]),
    tiers: z.array(tierInputSchema).min(1, "Add at least one pricing tier"),
  })
  .superRefine((product, ctx) => {
    const seen = new Map<number, number>();
    product.tiers.forEach((tier, index) => {
      const first = seen.get(tier.units_per_bundle);
      if (first !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiers", index, "units_per_bundle"],
          message: `Tier ${first + 1} already uses ${tier.units_per_bundle} units — each tier needs a different bundle size`,
        });
      } else {
        seen.set(tier.units_per_bundle, index);
      }
    });
  });

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductData = z.output<typeof productInputSchema>;
