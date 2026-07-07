"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton } from "@/components/ui";

export default function CustomerForm({
  action,
  defaults = {},
  submitLabel = "Save customer",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: { name?: string; phone?: string };
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={defaults.name} placeholder="Customer name" />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required defaultValue={defaults.phone} placeholder="03xx-xxxxxxx" />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Saved as an international number. Phone is unique — re-adding the same
          number updates the existing customer.
        </p>
      </div>
      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
