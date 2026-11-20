import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PricingTier } from "@/types";

import { packsLabel, tierPricing } from "../../lib/pricing";

type OfferCardsProps = {
  productId: string;
  tiers: PricingTier[];
  selectedId: string;
  bestValueId: string | null;
  onSelect: (tierId: string) => void;
};

/**
 * "Choose your offer": every tier as a large card. Native radio inputs give
 * radio-group semantics and arrow-key navigation for free. A single tier is
 * shown as a plain offer, not a one-option selector.
 */
export function OfferCards({
  productId,
  tiers,
  selectedId,
  bestValueId,
  onSelect,
}: OfferCardsProps) {
  if (tiers.length === 1 && tiers[0]) {
    return (
      <section aria-labelledby="offer-heading" className="space-y-3">
        <h2 id="offer-heading" className="font-display text-base font-semibold text-foreground">
          Your offer
        </h2>
        <OfferBody tier={tiers[0]} selected isBest={false} />
      </section>
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 font-display text-base font-semibold text-foreground">
        Choose your offer
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {tiers.map((tier) => {
          const selected = tier.id === selectedId;
          const inputId = `offer-${productId}-${tier.id}`;
          return (
            <label
              key={tier.id}
              htmlFor={inputId}
              className="group block cursor-pointer rounded-2xl has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
            >
              <input
                id={inputId}
                type="radio"
                name={`offer-${productId}`}
                value={tier.id}
                checked={selected}
                onChange={() => onSelect(tier.id)}
                className="sr-only"
              />
              <OfferBody
                tier={tier}
                selected={selected}
                isBest={tier.id === bestValueId}
                interactive
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function OfferBody({
  tier,
  selected,
  isBest,
  interactive = false,
}: {
  tier: PricingTier;
  selected: boolean;
  isBest: boolean;
  interactive?: boolean;
}) {
  const { bundleFils, perPackFils } = tierPricing(tier);
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-3 rounded-2xl border-2 bg-card p-4 transition-colors",
        interactive && "group-hover:border-primary/50",
        selected ? "border-primary bg-accent/50" : "border-border",
      )}
    >
      {isBest ? (
        <Badge variant="highlight" className="absolute -top-2.5 right-4 shadow-soft">
          Best value
        </Badge>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-foreground">{tier.label}</p>
          <p className="text-sm text-muted-foreground">
            {packsLabel(tier.units_per_bundle)} per bundle
          </p>
        </div>
        {interactive ? (
          <span
            aria-hidden
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
            )}
          >
            {selected ? <Check className="size-3" strokeWidth={3} /> : null}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <p className="font-display text-xl font-semibold tabular-nums text-foreground">
          {formatKWD(bundleFils)}
        </p>
        <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatKWD(perPackFils)} / pack
        </p>
      </div>
    </div>
  );
}
