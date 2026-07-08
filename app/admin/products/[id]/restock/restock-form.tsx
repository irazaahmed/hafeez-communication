"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton } from "@/components/ui";

/**
 * Restock form — ADD quantity to an existing product (never overwrites). The
 * live preview shows current → new total so it's obvious stock goes up.
 */
export default function RestockForm({
  action,
  currentQty,
  costPrice,
  salePrice,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  currentQty: number;
  costPrice: string;
  salePrice: string | null;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [addQty, setAddQty] = useState("");

  const add = Number.parseInt(addQty, 10);
  const newTotal = Number.isInteger(add) && add > 0 ? currentQty + add : currentQty;

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Currently in stock</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {currentQty} pcs
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">After restock</span>
          <span className="font-semibold tabular-nums text-brand-700 dark:text-brand-400">
            {newTotal} pcs
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="addQty">Quantity to add</Label>
        <Input
          id="addQty"
          name="addQty"
          type="number"
          min="1"
          step="1"
          required
          value={addQty}
          onChange={(e) => setAddQty(e.target.value)}
          placeholder="e.g. 10"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This is <span className="font-medium">added</span> to the current stock — it never replaces it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="costPrice">New cost price (optional)</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder={costPrice}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Leave blank to keep {costPrice}.
          </p>
        </div>
        <div>
          <Label htmlFor="salePrice">New sale price (optional)</Label>
          <Input
            id="salePrice"
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            placeholder={salePrice ?? "not set"}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Leave blank to keep {salePrice ? salePrice : "it unset"}.
          </p>
        </div>
      </div>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Adding…">Add to stock</SubmitButton>
    </form>
  );
}
