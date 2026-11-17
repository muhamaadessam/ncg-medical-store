-- =====================================================================
-- Catalog schema for NCG Pharmacy
-- NOTE: DEMO ONLY. Authentication is out of scope for this assessment,
-- so RLS is enabled with PUBLIC read AND PUBLIC write policies.
-- Do NOT ship these policies to production.
-- =====================================================================

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------- brands ----------
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO anon, authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
-- DEMO ONLY: public read/write
CREATE POLICY "Demo: public read brands" ON public.brands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo: public insert brands" ON public.brands FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Demo: public update brands" ON public.brands FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete brands" ON public.brands FOR DELETE TO anon, authenticated USING (true);

-- ---------- categories ----------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- DEMO ONLY: public read/write
CREATE POLICY "Demo: public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo: public insert categories" ON public.categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Demo: public update categories" ON public.categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete categories" ON public.categories FOR DELETE TO anon, authenticated USING (true);

-- ---------- products ----------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  images text[] NOT NULL DEFAULT '{}',
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_brand_id_idx ON public.products(brand_id);
CREATE INDEX products_category_id_idx ON public.products(category_id);
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- DEMO ONLY: public read/write
CREATE POLICY "Demo: public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo: public insert products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Demo: public update products" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete products" ON public.products FOR DELETE TO anon, authenticated USING (true);

-- ---------- pricing_tiers ----------
-- Each tier is an independent bundle offer. bundle_price is the TOTAL
-- price of the whole bundle (KWD, 3 decimals), NOT a per-unit price.
-- A product may have any number of tiers.
CREATE TABLE public.pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  units_per_bundle integer NOT NULL CHECK (units_per_bundle > 0),
  bundle_price numeric(10,3) NOT NULL CHECK (bundle_price > 0),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, units_per_bundle)
);
CREATE INDEX pricing_tiers_product_id_idx ON public.pricing_tiers(product_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_tiers TO anon, authenticated;
GRANT ALL ON public.pricing_tiers TO service_role;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
-- DEMO ONLY: public read/write
CREATE POLICY "Demo: public read pricing_tiers" ON public.pricing_tiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo: public insert pricing_tiers" ON public.pricing_tiers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Demo: public update pricing_tiers" ON public.pricing_tiers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete pricing_tiers" ON public.pricing_tiers FOR DELETE TO anon, authenticated USING (true);

-- ---------- storage: product-images bucket ----------
-- DEMO ONLY: public read and public write on the product-images bucket.
CREATE POLICY "Demo: public read product-images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Demo: public upload product-images" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Demo: public update product-images" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Demo: public delete product-images" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'product-images');

-- =====================================================================
-- Seed data
-- =====================================================================
INSERT INTO public.brands (id, name) VALUES
  ('11111111-1111-1111-1111-111111111101', 'MediCare'),
  ('11111111-1111-1111-1111-111111111102', 'PharmaPlus');

INSERT INTO public.categories (id, name) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Vitamins & Supplements'),
  ('22222222-2222-2222-2222-222222222202', 'First Aid');

INSERT INTO public.products (id, name, description, images, brand_id, category_id) VALUES
  ('33333333-3333-3333-3333-3333333333a1',
   'Digital Thermometer',
   'Fast, accurate digital thermometer with a 10-second reading, fever alert beep and memory of the last reading. Suitable for oral, underarm and rectal use.',
   ARRAY[
     'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=1200&q=80',
     'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80'
   ],
   '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-3333333333b1',
   'Sterile Gauze Pads (10 pcs)',
   'Individually wrapped, highly absorbent 10 x 10 cm cotton gauze pads for cleaning and dressing minor cuts, scrapes and wounds.',
   ARRAY[
     'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=1200&q=80',
     'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&q=80'
   ],
   '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-3333333333c1',
   'Vitamin D3 1000 IU (60 caps)',
   'Daily vitamin D3 (cholecalciferol) supplement supporting healthy bones, teeth, muscles and immune function. One capsule a day with food.',
   ARRAY[
     'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80',
     'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1200&q=80'
   ],
   '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-3333333333d1',
   'Omega-3 Fish Oil (90 softgels)',
   'Purified fish oil rich in EPA and DHA to support heart, brain and eye health. Molecularly distilled, with no fishy aftertaste.',
   ARRAY[
     'https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=1200&q=80',
     'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&q=80'
   ],
   '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222201');

INSERT INTO public.pricing_tiers (product_id, label, units_per_bundle, bundle_price, sort_order) VALUES
  -- Product A: exactly one tier
  ('33333333-3333-3333-3333-3333333333a1', '1 Pack',   1,  3.750, 0),
  -- Product B: exactly two tiers
  ('33333333-3333-3333-3333-3333333333b1', '1 Pack',   1,  1.250, 0),
  ('33333333-3333-3333-3333-3333333333b1', '4 Packs',  4,  4.500, 1),
  -- Product C: exactly three tiers
  ('33333333-3333-3333-3333-3333333333c1', '1 Pack',   1,  5.500, 0),
  ('33333333-3333-3333-3333-3333333333c1', '4 Packs',  4, 19.500, 1),
  ('33333333-3333-3333-3333-3333333333c1', '12 Packs', 12, 55.000, 2),
  -- Product D: two tiers
  ('33333333-3333-3333-3333-3333333333d1', '1 Pack',   1,  6.250, 0),
  ('33333333-3333-3333-3333-3333333333d1', '3 Packs',  3, 17.000, 1);
