import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProducts } from "@/features/catalog";
import { BundleStepper } from "@/features/catalog/components/product/BundleStepper";
import { packsLabel } from "@/features/catalog/lib/pricing";
import { formatKWD } from "@/lib/money";

import { resolveCart, type ResolvedCartItem } from "../cartMath";
import { cartActions, useCartLines } from "../cartStore";

const noopSubscribe = () => () => {};
/** false during SSR and the hydration render, true afterwards (the cart lives in localStorage). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function CartView() {
  const hydrated = useHydrated();
  const lines = useCartLines();
  const { data: products } = useProducts();
  const cart = useMemo(() => resolveCart(lines, products), [lines, products]);

  // A tier deleted in the admin panel can't be bought any more: drop it and say so.
  const missingKey = cart.missingTierIds.join(",");
  useEffect(() => {
    if (!missingKey) return;
    cartActions.removeMany(missingKey.split(","));
    toast.warning("An offer in your cart is no longer available", {
      description: "It was removed from your cart.",
    });
  }, [missingKey]);

  if (!hydrated) return <CartSkeleton />;
  if (cart.items.length === 0) return <CartEmpty />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
      <section aria-label="Cart items" className="space-y-4">
        <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_40px] gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <span>Product &amp; offer</span>
          <span>Bundles</span>
          <span className="text-right">Line total</span>
          <span className="sr-only">Remove</span>
        </div>
        <ul className="space-y-3">
          {cart.items.map((item) => (
            <CartLineRow key={item.line.tierId} item={item} />
          ))}
        </ul>
      </section>

      <CartSummary
        lines={cart.items.length}
        totalBundles={cart.totalBundles}
        totalPacks={cart.totalPacks}
        subtotalFils={cart.subtotalFils}
      />
    </div>
  );
}

function CartLineRow({ item }: { item: ResolvedCartItem }) {
  const { product, tier, line, bundleFils, lineTotalFils, linePacks } = item;
  const image = product.images[0];

  return (
    <li className="rounded-2xl border bg-card p-4 shadow-soft md:grid md:grid-cols-[minmax(0,1fr)_150px_120px_40px] md:items-center md:gap-4">
      <div className="flex gap-3">
        <Link
          to="/products/$id"
          params={{ id: product.id }}
          className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
          tabIndex={-1}
          aria-hidden
        >
          {image ? (
            <img src={image} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" />
            </span>
          )}
        </Link>
        <div className="min-w-0 space-y-1">
          <Link
            to="/products/$id"
            params={{ id: product.id }}
            className="font-display font-semibold leading-snug text-foreground hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="text-sm text-foreground">
            Offer: <span className="font-medium">{tier.label}</span>{" "}
            <span className="text-muted-foreground">
              ({packsLabel(tier.units_per_bundle)} · {formatKWD(bundleFils)} per bundle)
            </span>
          </p>
          <p className="text-xs text-muted-foreground" data-testid="line-packs">
            {line.bundles} × {tier.label} = {packsLabel(linePacks)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 md:mt-0 md:block">
        <BundleStepper
          label="Bundles"
          value={line.bundles}
          onChange={(n) => cartActions.setBundles(tier.id, n)}
        />
        <p className="text-right md:hidden">
          <span className="block text-xs text-muted-foreground">Line total</span>
          <span className="font-mono text-base font-semibold tabular-nums">
            {formatKWD(lineTotalFils)}
          </span>
        </p>
      </div>

      <p className="hidden text-right font-mono text-base font-semibold tabular-nums md:block">
        {formatKWD(lineTotalFils)}
      </p>

      <div className="mt-3 flex justify-end md:mt-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${tier.label} of ${product.name}`}
          onClick={() => {
            cartActions.remove(tier.id);
            toast(`Removed ${tier.label} of ${product.name}`);
          }}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

function CartSummary({
  lines,
  totalBundles,
  totalPacks,
  subtotalFils,
}: {
  lines: number;
  totalBundles: number;
  totalPacks: number;
  subtotalFils: number;
}) {
  return (
    <aside
      aria-label="Order summary"
      className="rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-24"
    >
      <h2 className="font-display text-lg font-semibold">Summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <SummaryRow label="Items" value={String(lines)} />
        <SummaryRow label="Total bundles" value={String(totalBundles)} />
        <SummaryRow label="Total packs" value={String(totalPacks)} />
        <div className="flex items-baseline justify-between border-t pt-3">
          <dt className="font-medium text-foreground">Subtotal</dt>
          <dd
            className="font-mono text-xl font-semibold tabular-nums text-foreground"
            data-testid="subtotal"
          >
            {formatKWD(subtotalFils)}
          </dd>
        </div>
      </dl>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* span wrapper: disabled buttons don't fire hover events */}
            <span className="mt-5 block" tabIndex={0}>
              <Button className="w-full rounded-xl" disabled>
                Checkout
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Checkout is out of scope for this demo</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button variant="outline" className="mt-2 w-full rounded-xl" asChild>
        <Link to="/">Continue shopping</Link>
      </Button>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <ShoppingCart className="size-6" />
      </span>
      <h2 className="font-display text-lg font-semibold text-foreground">Your cart is empty</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick an offer on any product to add it here.
      </p>
      <Button className="mt-6 rounded-full" asChild>
        <Link to="/">
          <ShoppingBag />
          Browse products
        </Link>
      </Button>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8"
      role="status"
      aria-label="Loading cart"
    >
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
