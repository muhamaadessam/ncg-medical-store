import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBrands, useCategories, useProducts } from "@/features/catalog";

import { createTaxonomy, deleteTaxonomy, renameTaxonomy } from "../admin.functions";
import { taxonomyNameSchema, type TaxonomyKind } from "../schemas";
import { useAdminMutation } from "../useAdminMutation";

const COPY: Record<TaxonomyKind, { one: string; many: string; placeholder: string }> = {
  brands: { one: "brand", many: "Brands", placeholder: "e.g. HealthPlus" },
  categories: { one: "category", many: "Categories", placeholder: "e.g. Baby Care" },
};

type Item = { id: string; name: string; count: number };

export function TaxonomyManager({ kind }: { kind: TaxonomyKind }) {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const copy = COPY[kind];

  const items: Item[] = useMemo(() => {
    const rows = kind === "brands" ? brands : categories;
    const key = kind === "brands" ? "brand_id" : "category_id";
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      count: products.filter((p) => p[key] === r.id).length,
    }));
  }, [kind, brands, categories, products]);

  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);

  const create = useAdminMutation((name: string) => createTaxonomy({ data: { kind, name } }), {
    success: (_r, name) => `Added ${copy.one} “${name.trim()}”`,
  });
  const remove = useAdminMutation((item: Item) => deleteTaxonomy({ data: { kind, id: item.id } }), {
    success: (_r, item) => `Deleted ${copy.one} “${item.name}”`,
  });

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    const parsed = taxonomyNameSchema.safeParse({ name: newName });
    if (!parsed.success) {
      setNewError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    setNewError(null);
    create.mutate(parsed.data.name, { onSuccess: () => setNewName("") });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={onCreate} className="rounded-2xl border bg-card p-4 shadow-soft" noValidate>
        <Label htmlFor={`new-${kind}`}>New {copy.one}</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id={`new-${kind}`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={copy.placeholder}
            aria-invalid={newError ? true : undefined}
            aria-describedby={newError ? `new-${kind}-error` : undefined}
            className="h-10"
          />
          <Button type="submit" className="h-10 rounded-xl" disabled={create.isPending}>
            <Plus />
            {create.isPending ? "Adding…" : `Add ${copy.one}`}
          </Button>
        </div>
        {newError ? (
          <p id={`new-${kind}-error`} className="mt-1.5 text-xs text-destructive">
            {newError}
          </p>
        ) : null}
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <Tags className="mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">No {copy.many.toLowerCase()} yet</p>
          <p className="text-sm text-muted-foreground">Add the first one above.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card shadow-soft">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.count} product{item.count === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label={`Rename ${item.name}`}
                onClick={() => setEditing(item)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${item.name}`}
                onClick={() => setDeleting(item)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <RenameDialog kind={kind} item={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {copy.one} “{deleting?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.count > 0
                ? `${deleting.count} product${deleting.count === 1 ? " uses" : "s use"} this ${copy.one}, so it can't be deleted until ${deleting.count === 1 ? "it is" : "they are"} moved to another ${copy.one}.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RenameDialog({
  kind,
  item,
  onClose,
}: {
  kind: TaxonomyKind;
  item: Item | null;
  onClose: () => void;
}) {
  const copy = COPY[kind];
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rename = useAdminMutation(
    (vars: { id: string; name: string }) => renameTaxonomy({ data: { kind, ...vars } }),
    { success: (_r, vars) => `Renamed to “${vars.name}”` },
  );

  useEffect(() => {
    if (item) {
      setName(item.name);
      setError(null);
    }
  }, [item]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const parsed = taxonomyNameSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    rename.mutate({ id: item.id, name: parsed.data.name }, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <form onSubmit={onSubmit} noValidate key={item?.id}>
          <DialogHeader>
            <DialogTitle>Rename {copy.one}</DialogTitle>
            <DialogDescription>Products using it keep their link to it.</DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-1.5">
            <Label htmlFor="rename-input">Name</Label>
            <Input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={rename.isPending}>
              {rename.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
