import { useSyncExternalStore } from "react";

import { addLine, removeLine, sanitizeLines, setLineBundles, type CartLine } from "./cartMath";

/**
 * Cart store: the only place that changes cart lines. All validation happens in the
 * pure functions of cartMath.ts; this module just holds the state, persists it to
 * localStorage (cart only — the catalog lives in the database) and notifies React.
 */

const STORAGE_KEY = "ncg-pharmacy.cart.v1";
const EMPTY: readonly CartLine[] = Object.freeze([]);

let lines: readonly CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): readonly CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeLines(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeStorage(next: readonly CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): the cart still works for this tab.
  }
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  lines = readStorage();
  // Keep several open tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    lines = readStorage();
    emit();
  });
}

function emit(): void {
  for (const listener of listeners) listener();
}

function update(next: CartLine[]): void {
  ensureLoaded();
  lines = next;
  writeStorage(next);
  emit();
}

function subscribe(listener: () => void): () => void {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): readonly CartLine[] {
  ensureLoaded();
  return lines;
}

// The server never sees localStorage: render an empty cart there, so SSR and the first
// client render match, then React switches to the stored cart after hydration.
function getServerSnapshot(): readonly CartLine[] {
  return EMPTY;
}

export const cartActions = {
  /** Adds `bundles` of a tier (default 1). Same tier again increases its bundles. */
  add(tierId: string, bundles = 1): void {
    update(addLine(getSnapshot(), tierId, bundles));
  },
  setBundles(tierId: string, bundles: number): void {
    update(setLineBundles(getSnapshot(), tierId, bundles));
  },
  remove(tierId: string): void {
    update(removeLine(getSnapshot(), tierId));
  },
  removeMany(tierIds: readonly string[]): void {
    const drop = new Set(tierIds);
    update(getSnapshot().filter((l) => !drop.has(l.tierId)));
  },
  clear(): void {
    update([]);
  },
};

export function useCartLines(): readonly CartLine[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
