import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  productInputSchema,
  taxonomyKindSchema,
  taxonomyNameSchema,
  type ProductData,
} from "./schemas";

/**
 * Admin write operations.
 *
 * Authentication is out of scope for this assessment, so the admin panel is open to anyone with
 * the link. The browser still has READ-ONLY database access (RLS); every write goes through these
 * server functions, which validate the input with the shared zod schemas and then use the
 * server-side service-role client. The key never reaches the browser.
 *
 * NOTE: this file ships to the client bundle as RPC stubs — server-only modules are imported
 * inside the handlers.
 */

type PgError = { code?: string; message?: string; details?: string | null } | null;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const LABEL: Record<"brands" | "categories", string> = { brands: "brand", categories: "category" };

function fail(error: PgError, fallback: string): never {
  if (error?.code === "23505") throw new Error("That name is already used. Pick a different one.");
  if (error?.code === "23503")
    throw new Error("It is still used by other records, so it can't be deleted.");
  console.error("[admin]", fallback, error);
  throw new Error(fallback);
}

// ---------------------------------------------------------------- brands & categories

const createTaxonomyInput = z.object({ kind: taxonomyKindSchema }).merge(taxonomyNameSchema);
const renameTaxonomyInput = createTaxonomyInput.extend({ id: z.string().uuid() });
const deleteTaxonomyInput = z.object({ kind: taxonomyKindSchema, id: z.string().uuid() });

export const createTaxonomy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createTaxonomyInput.parse(input))
  .handler(async ({ data }) => {
    const client = await db();
    const { data: row, error } = await client
      .from(data.kind)
      .insert({ name: data.name })
      .select()
      .single();
    if (error) fail(error, `Couldn't create the ${LABEL[data.kind]}.`);
    return row;
  });

export const renameTaxonomy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => renameTaxonomyInput.parse(input))
  .handler(async ({ data }) => {
    const client = await db();
    const { data: row, error } = await client
      .from(data.kind)
      .update({ name: data.name })
      .eq("id", data.id)
      .select()
      .maybeSingle();
    if (error) fail(error, `Couldn't rename the ${LABEL[data.kind]}.`);
    if (!row) throw new Error(`That ${LABEL[data.kind]} no longer exists.`);
    return row;
  });

export const deleteTaxonomy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteTaxonomyInput.parse(input))
  .handler(async ({ data }) => {
    const client = await db();
    const column = data.kind === "brands" ? "brand_id" : "category_id";
    const { count, error: countError } = await client
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq(column, data.id);
    if (countError) fail(countError, `Couldn't delete the ${LABEL[data.kind]}.`);
    if (count && count > 0) {
      throw new Error(
        `Cannot delete: ${count} product${count === 1 ? " uses" : "s use"} this ${LABEL[data.kind]}. Reassign ${count === 1 ? "it" : "them"} first.`,
      );
    }
    // The foreign keys are ON DELETE RESTRICT, so the database also refuses if a product sneaks in.
    const { error } = await client.from(data.kind).delete().eq("id", data.id);
    if (error) fail(error, `Couldn't delete the ${LABEL[data.kind]}.`);
    return { id: data.id };
  });

// ---------------------------------------------------------------- products & pricing tiers

/** Large temporary bundle sizes used while two tiers swap sizes, so UNIQUE(product_id, units) never trips. */
const TEMP_UNITS_BASE = 1_000_000;

async function saveTiers(
  client: Awaited<ReturnType<typeof db>>,
  productId: string,
  product: ProductData,
) {
  const { data: existing, error } = await client
    .from("pricing_tiers")
    .select("id, units_per_bundle")
    .eq("product_id", productId);
  if (error) fail(error, "Couldn't load the existing pricing tiers.");

  const existingIds = new Set((existing ?? []).map((t) => t.id));
  const kept = product.tiers
    .map((tier, index) => ({ ...tier, sort_order: index }))
    .filter((t) => t.id && existingIds.has(t.id));
  const keptIds = new Set(kept.map((t) => t.id));
  const added = product.tiers
    .map((tier, index) => ({ ...tier, sort_order: index }))
    .filter((t) => !t.id || !existingIds.has(t.id));
  const removedIds = (existing ?? []).filter((t) => !keptIds.has(t.id)).map((t) => t.id);

  // 1. Delete removed tiers (frees their bundle sizes).
  if (removedIds.length > 0) {
    const { error: delError } = await client.from("pricing_tiers").delete().in("id", removedIds);
    if (delError) fail(delError, "Couldn't delete the removed pricing tiers.");
  }

  // 2. Kept tiers whose size changes move to a temporary size first, then 3. get their final values.
  //    Updating in place keeps tier ids stable, so carts holding them pick up new prices.
  const units = new Map((existing ?? []).map((t) => [t.id, t.units_per_bundle]));
  const resized = kept.filter((t) => units.get(t.id!) !== t.units_per_bundle);
  for (const [i, tier] of resized.entries()) {
    const { error: tmpError } = await client
      .from("pricing_tiers")
      .update({ units_per_bundle: TEMP_UNITS_BASE + i })
      .eq("id", tier.id!);
    if (tmpError) fail(tmpError, "Couldn't update the pricing tiers.");
  }
  for (const tier of kept) {
    const { error: updError } = await client
      .from("pricing_tiers")
      .update({
        label: tier.label,
        units_per_bundle: tier.units_per_bundle,
        bundle_price: Number(tier.bundle_price),
        sort_order: tier.sort_order,
      })
      .eq("id", tier.id!);
    if (updError) fail(updError, "Couldn't update the pricing tiers.");
  }

  // 4. Insert new tiers.
  if (added.length > 0) {
    const { error: insError } = await client.from("pricing_tiers").insert(
      added.map((t) => ({
        product_id: productId,
        label: t.label,
        units_per_bundle: t.units_per_bundle,
        bundle_price: Number(t.bundle_price),
        sort_order: t.sort_order,
      })),
    );
    if (insError) fail(insError, "Couldn't add the new pricing tiers.");
  }
}

export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => productInputSchema.parse(input))
  .handler(async ({ data }) => {
    const client = await db();
    const fields = {
      name: data.name,
      description: data.description || null,
      brand_id: data.brand_id,
      category_id: data.category_id,
      images: data.images,
    };

    if (data.id) {
      const { data: row, error } = await client
        .from("products")
        .update(fields)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error) fail(error, "Couldn't save the product.");
      if (!row) throw new Error("This product no longer exists.");
      await saveTiers(client, data.id, data);
      return { id: data.id };
    }

    const { data: row, error } = await client.from("products").insert(fields).select("id").single();
    if (error || !row) fail(error, "Couldn't create the product.");
    try {
      await saveTiers(client, row.id, data);
    } catch (tierError) {
      // Don't leave a product without offers behind.
      await client.from("products").delete().eq("id", row.id);
      throw tierError;
    }
    return { id: row.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const client = await db();
    // pricing_tiers.product_id is ON DELETE CASCADE, so the product's offers go with it.
    const { error } = await client.from("products").delete().eq("id", data.id);
    if (error) fail(error, "Couldn't delete the product.");
    return { id: data.id };
  });
