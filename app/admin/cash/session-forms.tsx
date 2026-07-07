"use client";

import { useActionState } from "react";
import { openSession, closeSession } from "@/lib/actions/cash";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Input, Label, SubmitButton } from "@/components/ui";

export function OpenSessionForm() {
  const [state, formAction] = useActionState<FormState, FormData>(openSession, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="openingAmount">Opening cash (Rs.)</Label>
        <Input id="openingAmount" name="openingAmount" type="number" min="0" step="0.01" required />
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
