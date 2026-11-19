import { PageContainer } from "@/components/layout/PageContainer";
import { useProduct } from "@/features/catalog";
import { ProductDetails } from "@/features/catalog/components/product/ProductDetails";
import {
  ProductDetailsError,
  ProductDetailsSkeleton,
  ProductNotFound,
} from "@/features/catalog/components/product/ProductDetailsStates";

// Bottom padding on phones leaves room for the sticky checkout bar.
const PAGE_CLASS = "pb-28 lg:pb-10";

export function ProductPage({ id }: { id: string }) {
  const { data: product } = useProduct(id);
  return (
    <PageContainer className={PAGE_CLASS}>
      {product ? <ProductDetails key={product.id} product={product} /> : <ProductNotFound />}
    </PageContainer>
  );
}

export function ProductPageLoading() {
  return (
    <PageContainer className={PAGE_CLASS}>
      <ProductDetailsSkeleton />
    </PageContainer>
  );
}

export function ProductPageNotFound() {
  return (
    <PageContainer>
      <ProductNotFound />
    </PageContainer>
  );
}

export function ProductPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <PageContainer>
      <ProductDetailsError onRetry={onRetry} />
    </PageContainer>
  );
}
