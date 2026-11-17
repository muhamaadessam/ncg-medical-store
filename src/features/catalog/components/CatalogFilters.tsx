import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CatalogSearch } from "../lib/filters";

export type FacetOption = { id: string; name: string; count: number };

type FacetGroup = {
  key: keyof CatalogSearch;
  title: string;
  allCount: number;
  options: FacetOption[];
};

type CatalogFiltersProps = {
  search: CatalogSearch;
  groups: FacetGroup[];
};

const hasFilters = (search: CatalogSearch) => Boolean(search.brand || search.category);

export function ClearFiltersButton({ className }: { className?: string }) {
  return (
    <Button asChild variant="outline" size="sm" className={cn("rounded-full", className)}>
      <Link to="/" search={{}}>
        <X />
        Clear filters
      </Link>
    </Button>
  );
}

/** Desktop: sticky sidebar with one list per filter group. */
export function FilterSidebar({ search, groups }: CatalogFiltersProps) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filters">
      <div className="sticky top-24 space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <ul className="space-y-0.5">
              <li>
                <FacetLink group={group} id={undefined} label="All" count={group.allCount} search={search} variant="row" />
              </li>
              {group.options.map((o) => (
                <li key={o.id}>
                  <FacetLink group={group} id={o.id} label={o.name} count={o.count} search={search} variant="row" />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {hasFilters(search) ? <ClearFiltersButton className="ml-3" /> : null}
      </div>
    </aside>
  );
}

/** Mobile/tablet: one horizontally scrollable chip row per filter group. */
export function FilterChips({ search, groups }: CatalogFiltersProps) {
  return (
    <div className="-mx-4 mb-5 space-y-2 lg:hidden" aria-label="Filters" role="region">
      {groups.map((group) => (
        <div
          key={group.key}
          className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 pb-1"
        >
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </span>
          <FacetLink group={group} id={undefined} label="All" count={group.allCount} search={search} variant="chip" />
          {group.options.map((o) => (
            <FacetLink key={o.id} group={group} id={o.id} label={o.name} count={o.count} search={search} variant="chip" />
          ))}
        </div>
      ))}
      {hasFilters(search) ? (
        <div className="px-4">
          <ClearFiltersButton />
        </div>
      ) : null}
    </div>
  );
}

function FacetLink({
  group,
  id,
  label,
  count,
  search,
  variant,
}: {
  group: FacetGroup;
  id: string | undefined;
  label: string;
  count: number;
  search: CatalogSearch;
  variant: "row" | "chip";
}) {
  const active = search[group.key] === id;
  return (
    <Link
      to="/"
      search={(prev) => ({ ...prev, [group.key]: id })}
      replace
      resetScroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 text-sm transition-colors",
        variant === "row" &&
          "rounded-lg px-3 py-2 text-foreground hover:bg-muted",
        variant === "row" && active && "bg-accent font-medium text-accent-foreground hover:bg-accent",
        variant === "chip" &&
          "shrink-0 rounded-full border bg-card px-3 py-1.5 text-foreground hover:border-primary/50",
        variant === "chip" && active && "border-primary bg-primary text-primary-foreground hover:border-primary",
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={cn(
          "min-w-6 rounded-full px-1.5 text-center text-xs tabular-nums",
          active
            ? variant === "chip"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
