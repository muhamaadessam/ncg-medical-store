import { PageContainer, PageHeading, PlaceholderPanel } from "@/components/layout/PageContainer";
import { useProduct } from "@/features/catalog";

export function ProductPage({ id }: { id: string }) {
  const { data: product } = useProduct(id);

  if (!product) {
    return (
      <PageContainer>
        <PageHeading title="Product not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeading title={product.name} subtitle={`${product.brand.name} · ${product.category.name}`} />
      <PlaceholderPanel>Product details page coming soon.</PlaceholderPanel>
    </PageContainer>
  );
}
