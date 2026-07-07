"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton } from "@/components/ui";

type Defaults = {
  name?: string;
  company?: string;
  variant?: string;
  category?: string;
  costPrice?: string;
  salePrice?: string;
  quantity?: string;
  imageUrl?: string;
};

export default function ProductForm({
  action,
  mode,
  defaults = {},
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  mode: "add" | "edit";
  defaults?: Defaults;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Product name</Label>
          <Input id="name" name="name" required defaultValue={defaults.name} placeholder="e.g. Fast Charger 25W" />
        </div>
        <div>
          <Label htmlFor="company">Company / brand</Label>
          <Input id="company" name="company" required defaultValue={defaults.company} placeholder="e.g. Samsung" />
        </div>
        <div>
          <Label htmlFor="variant">Variant (optional)</Label>
          <Input id="variant" name="variant" defaultValue={defaults.variant} placeholder="e.g. Type-C, Black" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" required defaultValue={defaults.category} placeholder="e.g. Chargers, Cables, Covers" />
        </div>
        <div>
          <Label htmlFor="costPrice">Cost price (Rs.)</Label>
          <Input id="costPrice" name="costPrice" type="number" min="0" step="0.01" required defaultValue={defaults.costPrice} />
        </div>
        <div>
          <Label htmlFor="salePrice">Sale price (Rs.)</Label>
          <Input id="salePrice" name="salePrice" type="number" min="0" step="0.01" required defaultValue={defaults.salePrice} />
        </div>
        <div>
          <Label htmlFor="quantity">
            {mode === "add" ? "Quantity" : "Quantity (leave blank to keep)"}
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="1"
            required={mode === "add"}
            defaultValue={mode === "add" ? defaults.quantity : ""}
            placeholder={mode === "edit" ? defaults.quantity : undefined}
          />
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL (optional)</Label>
          <Input id="imageUrl" name="imageUrl" defaultValue={defaults.imageUrl} placeholder="https://…" />
        </div>
      </div>

      {mode === "add" && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          If a product with the same name, company and variant already exists,
          its quantity is increased (restock) instead of creating a duplicate.
        </p>
      )}

      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">
        {mode === "add" ? "Add to stock" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
