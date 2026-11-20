<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Money: all price math uses integer fils via `src/lib/money.ts` (`toFils`, `formatKWD`); never do arithmetic on KWD floats. Why: KWD has 3 decimals and floats drift.
- Pricing tiers are independent bundle offers; `bundle_price` is the bundle total, and a product may have any number of tiers. Why: core business rule of the store.
- Structure: feature code in `src/features/{catalog,cart,admin}`, page components in `src/pages` (plain components, not routes), thin TanStack route files in `src/routes` that set `head()`, prime data in the loader and render a page. Why: the brief's folder layout while keeping TanStack file routing.
- Data: each catalog read is a `queryOptions` factory in `src/features/catalog/api/queries.ts`; loaders call `ensureQueryData`, components use the `useSuspenseQuery` hooks; route `pendingComponent`/`errorComponent` own loading and error UI. Why: SSR-safe cache priming.
- Storefront filters: validated from the URL query string (`parseCatalogSearch`), applied client-side to the full product list with faceted counts (`src/features/catalog/lib/filters.ts`). Why: instant filtering and counts from one request at catalog size.
- Pricing display logic (per-pack price, best value) lives in `src/features/catalog/lib/pricing.ts` and compares tiers by integer cross-multiplication. Why: no float rounding in comparisons.
- Query retries are off; the database client already retries failed reads. Why: avoids a ~15s wait before the error screen.
- DB types: `src/types` re-exports row types from the generated `src/integrations/supabase/types.ts`. Why: one source of truth.
- Access: catalog tables are publicly readable; all catalog writes and every `product-images` storage operation require `public.has_role(auth.uid(), 'admin')` (roles live in `public.user_roles`). Bucket is private, so storefront display of uploaded images must use server-issued signed URLs. Why: closes open write/delete access flagged by the security scan.
- Order quantities: bundle-count limits and input correction live in `src/features/catalog/lib/bundles.ts`; line totals come only from `bundleSummary` in `lib/pricing.ts` (bundle price × bundles). Why: one tested place for quantity and total rules, reused by the cart later.
- Product route throws `notFound()` from its loader for missing/malformed ids and returns a small DTO for `head()`; the page reads the full product from the query cache. Why: real 404 + per-product metadata without duplicating data.
