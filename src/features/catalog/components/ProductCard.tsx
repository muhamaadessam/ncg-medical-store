import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/cart";
import { formatKWD } from "@/lib/money";
import type { ProductWithRelations } from "@/types";

import { findBestValueTierId, tierPricing } from "../lib/pricing";
import { SingleTierPrice, TierOptions } from "./TierOptions";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const tiers = product.pricing_tiers;
  const [selectedId, setSelectedId] = useState<string | undefined>(tiers[0]?.id);
  const selectedTier = tiers.find((t) => t.id === selectedId) ?? tiers[0];
  const bestValueId = useMemo(() => findBestValueTierId(tiers), [tiers]);
  const image = product.images[0];

  const handleAdd = () => {
    if (!selectedTier) return;
    addToCart(selectedTier.id);
    toast.success("Added to cart", {
      description: `1 × ${selectedTier.label} of ${product.name} · ${formatKWD(tierPricing(selectedTier).bundleFils)}`,
    });
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift">
      <Link
        to="/products/$id"
        params={{ id: product.id }}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        aria-label={product.name}
        tabIndex={-1}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="soft">{product.brand.name}</Badge>
            <Badge variant="muted">{product.category.name}</Badge>
          </div>
          <h3 className="font-display text-base font-semibold leading-snug text-foreground">
            <Link
              to="/products/$id"
              params={{ id: product.id }}
              className="hover:text-primary focus-visible:text-primary focus-visible:outline-none"
            >
              {product.name}
            </Link>
          </h3>
        </div>

        {tiers.length === 0 ? (
          <p className="rounded-xl bg-muted px-3 py-3 text-sm text-muted-foreground">
            Currently unavailable
          </p>
        ) : tiers.length === 1 ? (
          <SingleTierPrice tier={tiers[0]} />
        ) : (
          <TierOptions
            productId={product.id}
            productName={product.name}
            tiers={tiers}
            selectedId={selectedTier.id}
            bestValueId={bestValueId}
            onSelect={setSelectedId}
          />
        )}

        <Button className="mt-auto w-full rounded-xl" onClick={handleAdd} disabled={!selectedTier}>
          <ShoppingCart />
          Add to cart
        </Button>
      </div>
    </article>
  );
}
