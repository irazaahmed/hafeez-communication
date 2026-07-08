"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createSale } from "@/lib/actions/sales";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, inputCls } from "@/components/ui";
import CustomerPicker, { type PickerCustomer } from "@/components/customer-picker";
import { formatMoney } from "@/lib/format";

export type SaleProduct = {
  id: string;
  name: string;
  company: string;
  variant: string | null;
  quantity: number;
  salePrice: string | null; // optional — used only as a suggested default
};

export default function SaleForm({
  products,
  customers,
}: {
  products: SaleProduct[];
  customers: PickerCustomer[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createSale, undefined);

  const [productId, setProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [amountPaid, setAmountPaid] = useState("0");

  // Searchable product picker state
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? products.filter((p) =>
          `${p.name} ${p.company} ${p.variant ?? ""}`.toLowerCase().includes(term),
        )
      : products;
    return list.slice(0, 30);
  }, [products, search]);

  // Close the picker dropdown when clicking away from it.
  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  const qtyNum = Number.parseInt(quantity, 10);
  const priceNum = Number.parseFloat(unitPrice);
  const total =
    Number.isFinite(priceNum) && Number.isInteger(qtyNum) && qtyNum > 0
      ? priceNum * qtyNum
      : 0;
  const paidNum = paymentType === "CASH" ? total : Number.parseFloat(amountPaid) || 0;
  const due = Math.max(0, total - paidNum);

  const overStock = selected ? qtyNum > selected.quantity : false;

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    // Sale price is optional on the product — only prefill when one is set.
    setUnitPrice(p?.salePrice ?? "");
    setPickerOpen(false);
    setSearch("");
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* hidden field carries the chosen product to the server action */}
      <input type="hidden" name="productId" value={productId} required />

      {/* Product — searchable picker */}
      <div ref={pickerRef} className="relative">
        <Label htmlFor="product-search">Product</Label>

        {selected && !pickerOpen ? (
          // Chosen product summary with a "Change" button
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`${inputCls} flex items-center justify-between gap-3 text-left`}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                {selected.name} · {selected.company}
                {selected.variant ? ` · ${selected.variant}` : ""}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {selected.quantity} in stock
                {selected.salePrice
                  ? ` · suggested ${formatMoney(selected.salePrice)}`
                  : " · no fixed price"}
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium text-brand-600 dark:text-brand-400">
              Change
            </span>
          </button>
        ) : (
          <>
            <Input
              id="product-search"
              type="search"
              autoComplete="off"
              placeholder="Type to search: name, company or variant…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPickerOpen(true);
              }}
              onFocus={() => setPickerOpen(true)}
            />
            {pickerOpen && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {matches.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No products match “{search}”.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {matches.map((p) => {
                      const out = p.quantity <= 0;
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            disabled={out}
                            onClick={() => onSelectProduct(p.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand-400/10"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                {p.name} · {p.company}
                                {p.variant ? ` · ${p.variant}` : ""}
                              </span>
                              {p.salePrice && (
                                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                  suggested {formatMoney(p.salePrice)}
                                </span>
                              )}
                            </span>
                            <span
                              className={`shrink-0 text-xs tabular-nums ${
                                out
                                  ? "text-red-500"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {out ? "out of stock" : `${p.quantity} in stock`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
        {selected && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {selected.quantity} in stock
            {selected.salePrice
              ? ` · suggested price ${formatMoney(selected.salePrice)}`
              : " · no fixed price — enter it below"}
          </p>
        )}
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
              Only {selected?.quantity} in stock.
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

      {/* Payment type */}
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

      <CustomerPicker customers={customers} />

      {/* Live totals */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Total</span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(total)}</span>
        </div>
        {paymentType === "CREDIT" && (
          <>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Paid now</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(paidNum)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Remaining (udhaar)</span>
              <span className="font-semibold tabular-nums text-gold-600 dark:text-gold-400">{formatMoney(due)}</span>
            </div>
          </>
        )}
      </div>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Recording…">Record sale &amp; make invoice</SubmitButton>
    </form>
  );
}
