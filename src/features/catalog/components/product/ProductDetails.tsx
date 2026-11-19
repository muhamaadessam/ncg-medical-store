import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { badgeVariants } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/cart";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PricingTier, ProductWithRelations } from "@/types";

import { MIN_BUNDLES } from "../../lib/bundles";
import { bundleSummary, findBestValueTierId } from "../../lib/pricing";
import { BundleStepper } from "./BundleStepper";
import { OfferCards } from "./OfferCards";
import { ProductGallery } from "./ProductGallery";

export function ProductDetails({ product }: { product: ProductWithRelations }) {
  const tiers = product.pricing_tiers;
  const [selectedId, setSelectedId] = useState<string | undefined>(tiers[0]?.id);
  const [bundles, setBundles] = useState(MIN_BUNDLES);
  const selectedTier = tiers.find((t) => t.id === selectedId) ?? tiers[0];
  const bestValueId = useMemo(() => findBestValueTierId(tiers), [tiers]);
  const summary = selectedTier ? bundleSummary(selectedTier, bundles) : null;

  const handleAdd = () => {
    if (!selectedTier || !summary) return;
    addToCart(selectedTier.id, bundles);
    toast.success("Added to cart", {
      description: `${bundles} × ${selectedTier.label} of ${product.name} · ${formatKWD(summary.totalFils)}`,
    });
  };

  return (
    <>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" search={{ category: product.category.id }}>
                {product.category.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="space-y-7">
          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/"
                search={{ brand: product.brand.id }}
                title={`All ${product.brand.name} products`}
                className={cn(badgeVariants({ variant: "soft" }), "py-1 hover:bg-primary hover:text-primary-foreground")}
              >
                {product.brand.name}
              </Link>
              <Link
                to="/"
                search={{ category: product.category.id }}
                title={`All ${product.category.name} products`}
                className={cn(badgeVariants({ variant: "muted" }), "py-1 hover:bg-primary hover:text-primary-foreground")}
              >
                {product.category.name}
              </Link>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>
            {product.description ? (
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
            ) : null}
          </header>

          {selectedTier && summary ? (
            <>
              <OfferCards
                productId={product.id}
                tiers={tiers}
                selectedId={selectedTier.id}
                bestValueId={bestValueId}
                onSelect={setSelectedId}
              />

              <BundleStepper value={bundles} onChange={setBundles} />

              <PriceSummary tier={selectedTier} bundles={bundles} summary={summary} onAdd={handleAdd} />
            </>
          ) : (
            <p className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">
              This product is currently unavailable.
            </p>
          )}
        </div>
      </div>

      {selectedTier && summary ? (
        <MobileCheckoutBar totalFils={summary.totalFils} bundles={bundles} tier={selectedTier} onAdd={handleAdd} />
      ) : null}
    </>
  );
}

type Summary = ReturnType<typeof bundleSummary>;

function PriceSummary({
  tier,
  bundles,
  summary,
  onAdd,
}: {
  tier: PricingTier;
  bundles: number;
  summary: Summary;
  onAdd: () => void;
}) {
  return (
    <section aria-labelledby="summary-heading" className="rounded-2xl border bg-card p-5 shadow-soft">
      <h2 id="summary-heading" className="sr-only">
        Price summary
      </h2>
      <dl className="space-y-2 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Offer</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {bundles} × {tier.label}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Total packs</dt>
          <dd className="font-medium tabular-nums text-foreground">{summary.totalPacks}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="font-medium text-foreground">Total</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums text-primary">
            {formatKWD(summary.totalFils)}
          </dd>
        </div>
      </dl>
      <Button size="lg" className="mt-5 hidden h-12 w-full rounded-xl text-base lg:flex" onClick={onAdd}>
        <ShoppingCart />
        Add to cart
      </Button>
    </section>
  );
}

function MobileCheckoutBar({
  totalFils,
  bundles,
  tier,
  onAdd,
}: {
  totalFils: number;
  bundles: number;
  tier: PricingTier;
  onAdd: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 shadow-lift backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {bundles} × {tier.label}
          </p>
          <p className="font-display text-lg font-semibold tabular-nums text-foreground">{formatKWD(totalFils)}</p>
        </div>
        <Button size="lg" className="h-11 shrink-0 rounded-xl" onClick={onAdd}>
          <ShoppingCart />
          Add to cart
        </Button>
      </div>
    </div>
  );
}
