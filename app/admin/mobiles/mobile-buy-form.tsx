"use client";

import { useActionState } from "react";
import { buyMobile } from "@/lib/actions/mobiles";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Input, Label, SubmitButton } from "@/components/ui";

export default function MobileBuyForm() {
  const [state, formAction] = useActionState<FormState, FormData>(buyMobile, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="model">Model</Label>
        <Input id="model" name="model" required placeholder="e.g. Infinix Hot 30" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="imei">IMEI (optional)</Label>
          <Input id="imei" name="imei" placeholder="15-digit IMEI" />
        </div>
        <div>
          <Label htmlFor="purchasePrice">Purchase price (Rs.)</Label>
          <Input id="purchasePrice" name="purchasePrice" type="number" min="0.01" step="0.01" required />
        </div>
      </div>
      <div>
        <Label htmlFor="purchasedFrom">Purchased from</Label>
        <Input id="purchasedFrom" name="purchasedFrom" required placeholder="Seller name / walk-in" />
      </div>
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Mobile added to stock." />}
      <SubmitButton pendingText="Saving…">Buy mobile</SubmitButton>
    </form>
  );
}
