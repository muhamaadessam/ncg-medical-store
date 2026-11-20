import { useMemo } from "react";
import { useFieldArray, useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImageOff,
  ImagePlus,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBrands, useCategories } from "@/features/catalog";
import { packsLabel } from "@/features/catalog/lib/pricing";
import { formatKWD, toFils } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

import { saveProduct } from "../admin.functions";
import { productInputSchema, type ProductInput } from "../schemas";
import { useAdminMutation } from "../useAdminMutation";

type FormValues = {
  name: string;
  description: string;
  brand_id: string;
  category_id: string;
  images: { url: string }[];
  tiers: { id?: string; label: string; units_per_bundle: string; bundle_price: string }[];
};

function toPayload(values: FormValues, id?: string): ProductInput {
  return {
    id,
    name: values.name,
    description: values.description,
    brand_id: values.brand_id,
    category_id: values.category_id,
    images: values.images.map((i) => i.url.trim()).filter(Boolean),
    tiers: values.tiers.map((t) => ({
      id: t.id,
      label: t.label,
      units_per_bundle: t.units_per_bundle as unknown as number,
      bundle_price: t.bundle_price,
    })),
  };
}

/** Runs the shared zod schema and maps its issues onto the form fields. */
function makeResolver(id?: string): Resolver<FormValues> {
  return async (values) => {
    const urls = values.images.map((i) => i.url.trim());
    const parsed = productInputSchema.safeParse(toPayload(values, id));
    if (parsed.success) return { values, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of parsed.error.issues) {
      let path = issue.path.map(String);
      // images are validated as plain strings but edited as { url } rows; map the index back.
      if (path[0] === "images" && path.length > 1) {
        const nonEmptyIndex = Number(path[1]);
        const formIndex =
          urls.map((u, i) => (u ? i : -1)).filter((i) => i >= 0)[nonEmptyIndex] ?? 0;
        path = ["images", String(formIndex), "url"];
      }
      const key = path.join(".") || "root";
      errors[key] ??= { type: issue.code, message: issue.message };
    }
    // react-hook-form expects nested objects; build them from the dotted keys.
    const nested: Record<string, unknown> = {};
    for (const [key, err] of Object.entries(errors)) {
      const parts = key.split(".");
      let node = nested;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) node[part] = err;
        else node = (node[part] ??= {}) as Record<string, unknown>;
      });
    }
    return { values: {}, errors: nested as FieldErrors<FormValues> };
  };
}

function initialValues(product?: ProductWithRelations): FormValues {
  if (!product) {
    return {
      name: "",
      description: "",
      brand_id: "",
      category_id: "",
      images: [{ url: "" }],
      tiers: [{ label: "1 Pack", units_per_bundle: "1", bundle_price: "" }],
    };
  }
  return {
    name: product.name,
    description: product.description ?? "",
    brand_id: product.brand_id,
    category_id: product.category_id,
    images: product.images.length ? product.images.map((url) => ({ url })) : [{ url: "" }],
    tiers: product.pricing_tiers.map((t) => ({
      id: t.id,
      label: t.label,
      units_per_bundle: String(t.units_per_bundle),
      bundle_price: formatKWD(toFils(t.bundle_price)).replace(" KWD", ""),
    })),
  };
}

function perPackHint(units: string, price: string): string | null {
  const u = Number(units);
  const p = price.trim().replace(",", ".");
  if (!Number.isInteger(u) || u < 1 || !/^\d+(\.\d{1,3})?$/.test(p) || Number(p) <= 0) return null;
  const bundleFils = toFils(p);
  return u === 1
    ? `${formatKWD(bundleFils)} for 1 pack`
    : `${formatKWD(bundleFils)} for ${packsLabel(u)} · ≈ ${formatKWD(Math.round(bundleFils / u))} per pack`;
}

const fieldError = "mt-1 text-xs text-destructive";
const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive";

export function ProductForm({ product }: { product?: ProductWithRelations | undefined }) {
  const navigate = useNavigate();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const resolver = useMemo(() => makeResolver(product?.id), [product?.id]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: initialValues(product), resolver, mode: "onTouched" });

  const images = useFieldArray({ control, name: "images" });
  const tiers = useFieldArray({ control, name: "tiers" });
  const watchedTiers = watch("tiers");
  const watchedImages = watch("images");

  const save = useAdminMutation((payload: ProductInput) => saveProduct({ data: payload }), {
    success: (_r, payload) => (product ? `Saved “${payload.name}”` : `Created “${payload.name}”`),
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate(toPayload(values, product?.id), {
      onSuccess: () => void navigate({ to: "/admin", search: { tab: "products" } }),
    });
  });

  const noTaxonomy = brands.length === 0 || categories.length === 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Link
        to="/admin"
        search={{ tab: "products" }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      {noTaxonomy ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          Create at least one brand and one category first.
        </p>
      ) : null}

      {/* Details */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Details</h2>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" className="mt-1.5" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name ? <p className={fieldError}>{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} className="mt-1.5" {...register("description")} />
          {errors.description ? <p className={fieldError}>{errors.description.message}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="brand">Brand</Label>
            <select
              id="brand"
              className={cn(selectClass, "mt-1.5")}
              aria-invalid={!!errors.brand_id}
              {...register("brand_id")}
            >
              <option value="">Choose a brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.brand_id ? <p className={fieldError}>{errors.brand_id.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className={cn(selectClass, "mt-1.5")}
              aria-invalid={!!errors.category_id}
              {...register("category_id")}
            >
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id ? <p className={fieldError}>{errors.category_id.message}</p> : null}
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
        <div>
          <h2 className="font-display text-lg font-semibold">Images</h2>
          <p className="text-sm text-muted-foreground">
            Paste image links (https://…). The first one is the main image.
          </p>
        </div>
        <ul className="space-y-3">
          {images.fields.map((field, index) => {
            const url = watchedImages[index]?.url?.trim();
            const err = errors.images?.[index]?.url;
            return (
              <li key={field.id} className="flex items-start gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {url ? (
                    <img src={url} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-4" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label={`Image ${index + 1} URL`}
                    placeholder="https://…"
                    aria-invalid={!!err}
                    {...register(`images.${index}.url`)}
                  />
                  {err ? <p className={fieldError}>{err.message}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => images.remove(index)}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => images.append({ url: "" })}
          disabled={images.fields.length >= 8}
        >
          <ImagePlus />
          Add image
        </Button>
      </section>

      {/* Pricing tiers */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
        <div>
          <h2 className="font-display text-lg font-semibold">Pricing tiers</h2>
          <p className="text-sm text-muted-foreground">
            Each tier is a separate bundle offer. The price is the total for the whole bundle, not
            per pack.
          </p>
        </div>
        {errors.tiers?.root?.message || errors.tiers?.message ? (
          <p className={fieldError}>{errors.tiers?.root?.message ?? errors.tiers?.message}</p>
        ) : null}
        <ol className="space-y-3">
          {tiers.fields.map((field, index) => {
            const tierErrors = errors.tiers?.[index];
            const values = watchedTiers[index];
            const hint = values ? perPackHint(values.units_per_bundle, values.bundle_price) : null;
            return (
              <li key={field.id} className="rounded-xl border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Tier {index + 1}</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Move tier ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => tiers.move(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Move tier ${index + 1} down`}
                      disabled={index === tiers.fields.length - 1}
                      onClick={() => tiers.move(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove tier ${index + 1}`}
                      disabled={tiers.fields.length === 1}
                      title={
                        tiers.fields.length === 1 ? "A product needs at least one tier" : undefined
                      }
                      onClick={() => tiers.remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor={`tier-${index}-label`}>Label</Label>
                    <Input
                      id={`tier-${index}-label`}
                      placeholder="e.g. 4 Packs"
                      className="mt-1.5"
                      aria-invalid={!!tierErrors?.label}
                      {...register(`tiers.${index}.label`)}
                    />
                    {tierErrors?.label ? (
                      <p className={fieldError}>{tierErrors.label.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor={`tier-${index}-units`}>Units per bundle</Label>
                    <Input
                      id={`tier-${index}-units`}
                      inputMode="numeric"
                      className="mt-1.5"
                      aria-invalid={!!tierErrors?.units_per_bundle}
                      {...register(`tiers.${index}.units_per_bundle`)}
                    />
                    {tierErrors?.units_per_bundle ? (
                      <p className={fieldError}>{tierErrors.units_per_bundle.message}</p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor={`tier-${index}-price`}>Bundle price (KWD)</Label>
                    <Input
                      id={`tier-${index}-price`}
                      inputMode="decimal"
                      placeholder="19.500"
                      className="mt-1.5"
                      aria-invalid={!!tierErrors?.bundle_price}
                      {...register(`tiers.${index}.bundle_price`)}
                    />
                    {tierErrors?.bundle_price ? (
                      <p className={fieldError}>{tierErrors.bundle_price.message}</p>
                    ) : null}
                  </div>
                </div>
                {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => tiers.append({ label: "", units_per_bundle: "", bundle_price: "" })}
        >
          <Plus />
          Add tier
        </Button>
      </section>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link to="/admin" search={{ tab: "products" }}>
            Cancel
          </Link>
        </Button>
        <Button type="submit" className="rounded-xl" disabled={save.isPending || noTaxonomy}>
          <Save />
          {save.isPending ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
