import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type Brand = Tables["brands"]["Row"];
export type BrandInsert = Tables["brands"]["Insert"];
export type BrandUpdate = Tables["brands"]["Update"];

export type Category = Tables["categories"]["Row"];
export type CategoryInsert = Tables["categories"]["Insert"];
export type CategoryUpdate = Tables["categories"]["Update"];

export type Product = Tables["products"]["Row"];
export type ProductInsert = Tables["products"]["Insert"];
export type ProductUpdate = Tables["products"]["Update"];

/**
 * An independent bundle offer. `bundle_price` is the TOTAL KWD price of the
 * whole bundle (not per unit). Convert with toFils() before any math.
 */
export type PricingTier = Tables["pricing_tiers"]["Row"];
export type PricingTierInsert = Tables["pricing_tiers"]["Insert"];
export type PricingTierUpdate = Tables["pricing_tiers"]["Update"];

/** Product joined with its brand, category and tiers (tiers ordered by sort_order). */
export type ProductWithRelations = Product & {
  brand: Brand;
  category: Category;
  pricing_tiers: PricingTier[];
};
