import { useEffect } from "react";
import { useQueryErrorResetBoundary, type QueryClient } from "@tanstack/react-query";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";

import {
  brandsQueryOptions,
  categoriesQueryOptions,
  productsQueryOptions,
} from "@/features/catalog";
import { AdminError } from "@/pages/AdminPage";

/** Every admin screen needs the full catalog (lists, counts, brand/category pickers). */
export function primeAdminData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.ensureQueryData(productsQueryOptions()),
    queryClient.ensureQueryData(brandsQueryOptions()),
    queryClient.ensureQueryData(categoriesQueryOptions()),
  ]).then(() => undefined);
}

export function AdminRouteError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorBoundary = useQueryErrorResetBoundary();
  useEffect(() => {
    queryErrorBoundary.reset();
  }, [queryErrorBoundary]);
  return (
    <AdminError
      onRetry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}
