import { Link } from "@tanstack/react-router";
import { Cross, ShoppingCart } from "lucide-react";

import { useCartItemCount } from "@/features/cart";

const navLinkClass =
  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
const navLinkActiveClass = "bg-accent text-accent-foreground";

export function AppHeader() {
  const cartCount = useCartItemCount();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Cross className="size-5" strokeWidth={2.5} />
          </span>
          <span className="font-display whitespace-nowrap text-base font-semibold tracking-tight text-foreground sm:text-lg">
            NCG <span className="text-primary">Pharmacy</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          <Link
            to="/"
            className={navLinkClass}
            activeProps={{ className: navLinkActiveClass }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link to="/admin" className={navLinkClass} activeProps={{ className: navLinkActiveClass }}>
            Admin
          </Link>
          <Link
            to="/cart"
            className={`${navLinkClass} relative flex items-center gap-1.5`}
            activeProps={{ className: navLinkActiveClass }}
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">
              {cartCount}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
