"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateSale } from "@/lib/actions/sales";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton } from "@/components/ui";
import CustomerPicker, { type PickerCustomer } from "@/components/customer-picker";
import { formatMoney } from "@/lib/format";

type EditableSale = {
  id: string;
  quantity: number;
  unitPrice: string;
  paymentType: "CASH" | "CREDIT";
  amountPaid: string;
  customerId: string | null;
};

export default function EditSaleForm({
  sale,
  product,
  customers,
}: {
  sale: EditableSale;
  product: { label: string; maxQuantity: number };
  customers: PickerCustomer[];
}) {
  const action = updateSale.bind(null, sale.id);
  const [state, formAction] = useActionState<FormState, FormData>(action, undefined);

  const [quantity, setQuantity] = useState(String(sale.quantity));
  const [unitPrice, setUnitPrice] = useState(sale.unitPrice);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">(sale.paymentType);
  const [amountPaid, setAmountPaid] = useState(sale.amountPaid);

  const qtyNum = Number.parseInt(quantity, 10);
  const priceNum = Number.parseFloat(unitPrice);
  const total =
    Number.isFinite(priceNum) && Number.isInteger(qtyNum) && qtyNum > 0 ? priceNum * qtyNum : 0;
  const paidNum = paymentType === "CASH" ? total : Number.parseFloat(amountPaid) || 0;
  const due = Math.max(0, total - paidNum);

  const overStock = Number.isInteger(qtyNum) && qtyNum > product.maxQuantity;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label>Product</Label>
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          {product.label}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Product can&apos;t be changed here — delete and re-enter the sale if the wrong item was
          picked.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {overStock && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Only {product.maxQuantity} unit(s) available for this sale.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="unitPrice">Unit price (Rs.)</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Payment</Label>
        <div className="flex gap-2">
          {(["CASH", "CREDIT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPaymentType(t)}
              className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                paymentType === t
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-400"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {t === "CASH" ? "Cash (paid in full)" : "Credit (udhaar)"}
            </button>
          ))}
        </div>
        <input type="hidden" name="paymentType" value={paymentType} />
      </div>

      {paymentType === "CREDIT" && (
        <div>
          <Label htmlFor="amountPaid">Amount paid now (Rs.)</Label>
          <Input
            id="amountPaid"
            name="amountPaid"
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enter 0 for full credit, or a part payment.
          </p>
        </div>
      )}

      <CustomerPicker customers={customers} defaultCustomerId={sale.customerId ?? ""} />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatMoney(total)}
          </span>
        </div>
        {paymentType === "CREDIT" && (
          <>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Paid now</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(paidNum)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Remaining (udhaar)</span>
              <span className="font-semibold tabular-nums text-gold-600 dark:text-gold-400">
                {formatMoney(due)}
              </span>
            </div>
          </>
        )}
      </div>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
