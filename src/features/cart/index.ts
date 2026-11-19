/**
 * Cart feature (placeholder). Cart state and pricing math will live here and
 * must use integer fils from @/lib/money.
 */
export function useCartItemCount(): number {
  return 0;
}

/**
 * Placeholder: adds `bundles` bundles (default 1) of the given pricing tier to the cart.
 * The real cart store replaces this in a later step.
 */
export function addToCart(tierId: string, bundles = 1): void {
  void tierId;
  void bundles;
}
