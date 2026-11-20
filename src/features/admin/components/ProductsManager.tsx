import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/features/catalog";
import { formatKWD, toFils } from "@/lib/money";
import type { ProductWithRelations } from "@/types";

import { deleteProduct } from "../admin.functions";
import { useAdminMutation } from "../useAdminMutation";

function priceRange(product: ProductWithRelations): string {
  const fils = product.pricing_tiers.map((t) => toFils(t.bundle_price));
  if (fils.length === 0) return "No offers";
  const min = Math.min(...fils);
  const max = Math.max(...fils);
  return min === max ? formatKWD(min) : `${formatKWD(min)} – ${formatKWD(max)}`;
}

export function ProductsManager() {
  const { data: products } = useProducts();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<ProductWithRelations | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);

  const remove = useAdminMutation(
    (p: ProductWithRelations) => deleteProduct({ data: { id: p.id } }),
    {
      success: (_r, p) => `Deleted “${p.name}” and its offers`,
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products by name"
            className="h-10 pl-9"
          />
        </div>
        <Button asChild className="h-10 rounded-xl">
          <Link to="/admin/products/new">
            <PackagePlus />
            New product
          </Link>
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">
            {products.length === 0 ? "No products yet" : "No products match your search"}
          </p>
          <p className="text-sm text-muted-foreground">
            {products.length === 0
              ? "Create the first one with “New product”."
              : "Try another name."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visible.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="soft">{p.brand.name}</Badge>
                    <Badge variant="muted">{p.category.name}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-sm sm:text-right">
                  <p className="font-medium tabular-nums">{priceRange(p)}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.pricing_tiers.length} pricing tier{p.pricing_tiers.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    aria-label={`Edit ${p.name}`}
                  >
                    <Link to="/admin/products/$id" params={{ id: p.id }}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The product and its {deleting?.pricing_tiers.length ?? 0} pricing tier(s) will be
              removed from the store. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
