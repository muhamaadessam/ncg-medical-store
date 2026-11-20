/**
 * Cart feature. Lines are keyed by pricing tier and hold only { tierId, bundles };
 * prices come from the live catalog and all math uses integer fils (see cartMath.ts).
 */
import { cartActions, useCartLines } from "./cartStore";

export * from "./cartMath";
export { cartActions, useCartLines } from "./cartStore";

/** Number of cart lines (shown in the header badge). */
export function useCartItemCount(): number {
  return useCartLines().length;
}

/** Adds `bundles` bundles (default 1) of the given pricing tier to the cart. */
export function addToCart(tierId: string, bundles = 1): void {
  cartActions.add(tierId, bundles);
}
