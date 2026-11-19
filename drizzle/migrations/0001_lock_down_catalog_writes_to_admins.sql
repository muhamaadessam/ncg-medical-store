-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Catalog tables: public read, admin-only writes
DROP POLICY IF EXISTS "Demo: public insert brands" ON public.brands;
DROP POLICY IF EXISTS "Demo: public update brands" ON public.brands;
DROP POLICY IF EXISTS "Demo: public delete brands" ON public.brands;
DROP POLICY IF EXISTS "Demo: public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Demo: public update categories" ON public.categories;
DROP POLICY IF EXISTS "Demo: public delete categories" ON public.categories;
DROP POLICY IF EXISTS "Demo: public insert products" ON public.products;
DROP POLICY IF EXISTS "Demo: public update products" ON public.products;
DROP POLICY IF EXISTS "Demo: public delete products" ON public.products;
DROP POLICY IF EXISTS "Demo: public insert pricing_tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Demo: public update pricing_tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Demo: public delete pricing_tiers" ON public.pricing_tiers;

DROP POLICY IF EXISTS "Demo: public read brands" ON public.brands;
DROP POLICY IF EXISTS "Demo: public read categories" ON public.categories;
DROP POLICY IF EXISTS "Demo: public read products" ON public.products;
DROP POLICY IF EXISTS "Demo: public read pricing_tiers" ON public.pricing_tiers;

REVOKE INSERT, UPDATE, DELETE ON public.brands, public.categories, public.products, public.pricing_tiers FROM anon;
GRANT SELECT ON public.brands, public.categories, public.products, public.pricing_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands, public.categories, public.products, public.pricing_tiers TO authenticated;
GRANT ALL ON public.brands, public.categories, public.products, public.pricing_tiers TO service_role;

-- Storefront catalog is intentionally public to read
CREATE POLICY "Catalog: anyone can view brands" ON public.brands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Catalog: anyone can view categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Catalog: anyone can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Catalog: anyone can view pricing tiers" ON public.pricing_tiers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pricing tiers" ON public.pricing_tiers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pricing tiers" ON public.pricing_tiers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pricing tiers" ON public.pricing_tiers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage: product-images managed by admins only
DROP POLICY IF EXISTS "Demo: public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Demo: public upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Demo: public update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Demo: public delete product-images" ON storage.objects;

CREATE POLICY "Admins can read product-images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can upload product-images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin') AND owner_id = (SELECT auth.uid()::text));
CREATE POLICY "Admins can update product-images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product-images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));