import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { catalogKeys } from "@/features/catalog";

/** Server-function errors arrive as Error objects; show their message, never a stack trace. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    // zod errors thrown by an inputValidator are serialized as JSON issue lists.
    try {
      const issues = JSON.parse(error.message) as Array<{ message?: string }>;
      if (Array.isArray(issues) && issues[0]?.message)
        return issues.map((i) => i.message).join(" · ");
    } catch {
      // plain message
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * Runs an admin write, then refreshes every catalog query so the storefront, product pages,
 * cart and admin lists all show the change.
 */
export function useAdminMutation<TVars, TResult>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  { success }: { success?: (result: TResult, vars: TVars) => string } = {},
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn,
    onSuccess: async (result, vars) => {
      await queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      await router.invalidate();
      if (success) toast.success(success(result, vars));
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
