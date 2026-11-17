import { PageContainer, PageHeading, PlaceholderPanel } from "@/components/layout/PageContainer";

export function CartPage() {
  return (
    <PageContainer>
      <PageHeading title="Your cart" />
      <PlaceholderPanel>The cart will appear here.</PlaceholderPanel>
    </PageContainer>
  );
}
