"use client";

import { useActionState } from "react";
import { openSession, closeSession } from "@/lib/actions/cash";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Input, Label, SubmitButton } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export function OpenSessionForm({ lastClosingAmount }: { lastClosingAmount?: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(openSession, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="openingAmount">Opening cash (Rs.)</Label>
        <Input
          id="openingAmount"
          name="openingAmount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={lastClosingAmount}
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Enter the actual total cash you have right now — not an amount to add.
          {lastClosingAmount &&
            ` Last session closed at ${formatMoney(lastClosingAmount)}. Type the same figure to carry forward with no change, or a different one to record cash added/removed.`}
        </p>
      </div>
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Session opened." />}
      <SubmitButton pendingText="Opening…">Open session</SubmitButton>
    </form>
  );
}

export function CloseSessionForm() {
  const [state, formAction] = useActionState<FormState, FormData>(closeSession, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="closingAmount">Counted cash now (Rs.)</Label>
        <Input id="closingAmount" name="closingAmount" type="number" min="0" step="0.01" required />
      </div>
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Session closed." />}
      <SubmitButton pendingText="Closing…">Close &amp; reconcile</SubmitButton>
    </form>
  );
}
