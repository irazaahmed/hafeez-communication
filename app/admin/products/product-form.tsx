"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, btnPrimaryCls } from "@/components/ui";

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
          <Label htmlFor="salePrice">Sale price (optional)</Label>
          <Input id="salePrice" name="salePrice" type="number" min="0" step="0.01" defaultValue={defaults.salePrice} placeholder="Set at sale time" />
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

      {/* Restock confirmation — shown when "New stock" matches an existing product */}
      {mode === "add" && state?.restock && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            This product already exists
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/90">
            <span className="font-medium">{state.restock.label}</span> is already
            in stock ({state.restock.existingQty} pcs). A new one can&apos;t be
            created with the same name, company &amp; variant — this will{" "}
            <span className="font-semibold">restock (+{state.restock.addQty})</span>{" "}
            and refresh its price/specs.
          </p>
          <button
            type="submit"
            name="confirmRestock"
            value="1"
            className={`mt-3 ${btnPrimaryCls}`}
          >
            Yes, restock (+{state.restock.addQty})
          </button>
          <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-200/70">
            Want a different product instead? Change the name, company or variant
            above, then press “Add to stock”.
          </p>
        </div>
      )}

      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">
        {mode === "add" ? "Add to stock" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
