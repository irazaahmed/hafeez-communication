"use client";

import { useActionState } from "react";
import { createExpense } from "@/lib/actions/expenses";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Input, Label, SubmitButton } from "@/components/ui";

export default function ExpenseForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createExpense, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" required placeholder="e.g. Electricity, Rent, Tea" />
      </div>
      <div>
        <Label htmlFor="amount">Amount (Rs.)</Label>
        <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
      </div>
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="Detail" />
      </div>
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Expense recorded." />}
      <SubmitButton pendingText="Saving…">Add expense</SubmitButton>
    </form>
  );
}
