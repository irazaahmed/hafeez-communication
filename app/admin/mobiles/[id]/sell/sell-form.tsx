"use client";

import { useActionState } from "react";
import { sellMobile } from "@/lib/actions/mobiles";
import type { FormState } from "@/lib/actions/utils";
import { FormError, FormSuccess, Input, Label, SubmitButton } from "@/components/ui";
import CustomerPicker, { type PickerCustomer } from "@/components/customer-picker";

export default function MobileSellForm({
  mobileId,
  customers,
}: {
  mobileId: string;
  customers: PickerCustomer[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    sellMobile.bind(null, mobileId),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="salePrice">Sale price (Rs.)</Label>
        <Input id="salePrice" name="salePrice" type="number" min="0.01" step="0.01" required />
      </div>
      <CustomerPicker customers={customers} label="Sold to (optional)" />
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Mobile sold." />}
      <SubmitButton pendingText="Selling…">Confirm sale</SubmitButton>
    </form>
  );
}
