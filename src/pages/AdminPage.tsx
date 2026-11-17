import { PageContainer, PageHeading, PlaceholderPanel } from "@/components/layout/PageContainer";

export function AdminPage() {
  return (
    <PageContainer>
      <PageHeading title="Admin" subtitle="Manage products, brands, categories and pricing tiers." />
      <PlaceholderPanel>Admin tools are coming soon.</PlaceholderPanel>
    </PageContainer>
  );
}
