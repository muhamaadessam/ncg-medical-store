import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { productInputSchema, taxonomyKindSchema, taxonomyNameSchema } from "./schemas";

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
  // RAISE EXCEPTION from save_product_with_tiers carries a user-facing message.
  if (error?.code === "P0001" && error.message) throw new Error(error.message);
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

export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => productInputSchema.parse(input))
  .handler(async ({ data }) => {
    const client = await db();
    // One Postgres function saves the product and its tiers in a single transaction:
    // removed tiers are deleted, kept tiers are updated in place (ids stay stable, so carts
    // pick up new prices) and new tiers are inserted. Execute is granted to service_role only.
    const { data: id, error } = await client.rpc("save_product_with_tiers", {
      p_product: {
        id: data.id ?? null,
        name: data.name,
        description: data.description,
        brand_id: data.brand_id,
        category_id: data.category_id,
        images: data.images,
      },
      p_tiers: data.tiers.map((tier, index) => ({
        id: tier.id ?? null,
        label: tier.label,
        units_per_bundle: tier.units_per_bundle,
        // Sent as the validated decimal string so numeric(10,3) gets the exact value.
        bundle_price: tier.bundle_price,
        sort_order: index,
      })),
    });
    if (error) fail(error, data.id ? "Couldn't save the product." : "Couldn't create the product.");
    return { id: id as string };
  });

// ---------------------------------------------------------------- product images

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
/** The bucket is private; uploaded images are served through long-lived signed URLs (10 years). */
const SIGNED_URL_SECONDS = 10 * 365 * 24 * 60 * 60;

export const uploadProductImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected an image file.");
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image file.");
    if (!IMAGE_TYPES[file.type]) throw new Error("Use a JPG, PNG or WebP image.");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 3 MB or smaller.");
    return file;
  })
  .handler(async ({ data: file }) => {
    const client = await db();
    const path = `products/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
    const { error } = await client.storage
      .from("product-images")
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) {
      console.error("[admin] upload", error);
      throw new Error("Couldn't upload the image. Please try again.");
    }
    const { data: signed, error: signError } = await client.storage
      .from("product-images")
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (signError || !signed) {
      console.error("[admin] sign", signError);
      throw new Error("The image was uploaded but its link couldn't be created.");
    }
    return { url: signed.signedUrl };
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
