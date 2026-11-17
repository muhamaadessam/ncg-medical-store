import { PageContainer, PageHeading } from "@/components/layout/PageContainer";
import { useProducts } from "@/features/catalog";
import { formatKWD, toFils } from "@/lib/money";

/** Temporary seed check: lists every product and its tiers as plain text. */
export function HomePage() {
  const { data: products } = useProducts();

  return (
    <PageContainer>
      <PageHeading
        title="Catalog seed check"
        subtitle={`${products.length} products loaded from the database`}
      />
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-card-foreground">
          {products
            .map((p) => {
              const header = `${p.name}  ·  ${p.brand.name}  ·  ${p.category.name}  ·  ${p.pricing_tiers.length} tier(s)`;
              const tiers = p.pricing_tiers.map(
                (t) =>
                  `   - ${t.label}: ${t.units_per_bundle} unit(s) for ${formatKWD(toFils(t.bundle_price))} (bundle total)`,
              );
              return [header, ...tiers].join("\n");
            })
            .join("\n\n")}
        </pre>
      </div>
    </PageContainer>
  );
}
