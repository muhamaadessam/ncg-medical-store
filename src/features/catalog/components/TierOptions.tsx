import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatKWD } from "@/lib/money";
import type { PricingTier } from "@/types";

import { packsLabel, tierPricing } from "../lib/pricing";

type TierOptionsProps = {
  productId: string;
  productName: string;
  tiers: PricingTier[];
  selectedId: string;
  bestValueId: string | null;
  onSelect: (tierId: string) => void;
};

/** Selectable bundle offers (any number of tiers). Native radios keep keyboard + screen reader support. */
export function TierOptions({
  productId,
  productName,
  tiers,
  selectedId,
  bestValueId,
  onSelect,
}: TierOptionsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Choose a bundle for {productName}</legend>
      {tiers.map((tier) => {
        const { bundleFils, perPackFils } = tierPricing(tier);
        const selected = tier.id === selectedId;
        const inputId = `tier-${productId}-${tier.id}`;
        return (
          <label
            key={tier.id}
            htmlFor={inputId}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors",
              "hover:border-primary/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              selected && "border-primary bg-accent/60",
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={`tier-${productId}`}
              value={tier.id}
              checked={selected}
              onChange={() => onSelect(tier.id)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-primary" : "border-input",
              )}
            >
              {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">{tier.label}</span>
                {tier.id === bestValueId ? <Badge variant="highlight">Best value</Badge> : null}
              </span>
              <span className="block text-xs text-muted-foreground">
                {packsLabel(tier.units_per_bundle)} · {formatKWD(perPackFils)} / pack
              </span>
            </span>

            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatKWD(bundleFils)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** A product with exactly one offer: show a plain price instead of a one-option selector. */
export function SingleTierPrice({ tier }: { tier: PricingTier }) {
  const { bundleFils, perPackFils } = tierPricing(tier);
  return (
    <div className="flex items-end justify-between gap-3 rounded-xl bg-muted px-3 py-3">
      <div>
        <p className="text-xs text-muted-foreground">
          {tier.label} · {packsLabel(tier.units_per_bundle)}
        </p>
        <p className="font-display text-xl font-semibold tabular-nums text-foreground">
          {formatKWD(bundleFils)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">{formatKWD(perPackFils)} / pack</p>
    </div>
  );
}
