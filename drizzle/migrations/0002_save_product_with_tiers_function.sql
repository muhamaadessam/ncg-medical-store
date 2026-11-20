CREATE OR REPLACE FUNCTION public.save_product_with_tiers(p_product jsonb, p_tiers jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid := NULLIF(p_product->>'id', '')::uuid;
  v_updated integer;
BEGIN
  IF p_tiers IS NULL OR jsonb_typeof(p_tiers) <> 'array' OR jsonb_array_length(p_tiers) = 0 THEN
    RAISE EXCEPTION 'Add at least one pricing tier';
  END IF;

  IF v_product_id IS NULL THEN
    INSERT INTO public.products (name, description, images, brand_id, category_id)
    VALUES (
      p_product->>'name',
      NULLIF(p_product->>'description', ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_product->'images', '[]'::jsonb))), '{}'::text[]),
      (p_product->>'brand_id')::uuid,
      (p_product->>'category_id')::uuid
    )
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE public.products
    SET name = p_product->>'name',
        description = NULLIF(p_product->>'description', ''),
        images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_product->'images', '[]'::jsonb))), '{}'::text[]),
        brand_id = (p_product->>'brand_id')::uuid,
        category_id = (p_product->>'category_id')::uuid
    WHERE id = v_product_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
  END IF;

  -- Incoming tiers with their array position; an id counts as "kept" only if it belongs to this product.
  CREATE TEMP TABLE IF NOT EXISTS _incoming_tiers (
    pos integer, tier_id uuid, label text, units_per_bundle integer, bundle_price numeric, sort_order integer, kept boolean
  ) ON COMMIT DROP;
  TRUNCATE _incoming_tiers;

  INSERT INTO _incoming_tiers (pos, tier_id, label, units_per_bundle, bundle_price, sort_order, kept)
  SELECT t.ord::integer,
         NULLIF(t.elem->>'id', '')::uuid,
         t.elem->>'label',
         (t.elem->>'units_per_bundle')::integer,
         (t.elem->>'bundle_price')::numeric,
         COALESCE((t.elem->>'sort_order')::integer, (t.ord - 1)::integer),
         EXISTS (
           SELECT 1 FROM public.pricing_tiers pt
           WHERE pt.id = NULLIF(t.elem->>'id', '')::uuid AND pt.product_id = v_product_id
         )
  FROM jsonb_array_elements(p_tiers) WITH ORDINALITY AS t(elem, ord);

  -- 1. Delete this product's tiers that are no longer listed.
  DELETE FROM public.pricing_tiers pt
  WHERE pt.product_id = v_product_id
    AND NOT EXISTS (SELECT 1 FROM _incoming_tiers i WHERE i.kept AND i.tier_id = pt.id);

  -- 2. Move kept tiers to temporary sizes so swapped sizes never hit UNIQUE(product_id, units_per_bundle).
  UPDATE public.pricing_tiers pt
  SET units_per_bundle = 1000000 + i.pos
  FROM _incoming_tiers i
  WHERE i.kept AND pt.id = i.tier_id;

  -- 3. Give kept tiers their final values (ids stay the same).
  UPDATE public.pricing_tiers pt
  SET label = i.label,
      units_per_bundle = i.units_per_bundle,
      bundle_price = i.bundle_price,
      sort_order = i.sort_order
  FROM _incoming_tiers i
  WHERE i.kept AND pt.id = i.tier_id;

  -- 4. Insert new tiers (no id, or an id that does not belong to this product).
  INSERT INTO public.pricing_tiers (product_id, label, units_per_bundle, bundle_price, sort_order)
  SELECT v_product_id, i.label, i.units_per_bundle, i.bundle_price, i.sort_order
  FROM _incoming_tiers i
  WHERE NOT i.kept
  ORDER BY i.pos;

  RETURN v_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_product_with_tiers(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_product_with_tiers(jsonb, jsonb) TO service_role;

-- product-images: writes happen only server-side with the service role.
DROP POLICY IF EXISTS "Admins can upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product-images" ON storage.objects;