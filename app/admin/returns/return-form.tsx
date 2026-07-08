"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createReturn } from "@/lib/actions/returns";
import type { FormState } from "@/lib/actions/utils";
import { FormError, Input, Label, SubmitButton, inputCls } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export type SoldItem = {
  saleId: string;
  product: string;
  customer: string | null;
  soldQty: number;
  remainingQty: number; // still returnable
  unitPrice: string;
  totalPrice: string;
  soldOn: string; // preformatted date
};

export type SimpleCustomer = { id: string; name: string; phone: string };

/**
 * Return / refund entry. Two modes:
 *  - ITEM: pick a past sale, choose how many units come back → stock is restored
 *    and the customer refunded.
 *  - MONEY: a plain cash refund / change with no stock movement.
 */
export default function ReturnForm({
  soldItems,
  customers,
}: {
  soldItems: SoldItem[];
  customers: SimpleCustomer[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createReturn, undefined);

  const [type, setType] = useState<"ITEM" | "MONEY">("ITEM");
  const [saleId, setSaleId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [refund, setRefund] = useState("");

  // Sold-item searchable picker
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => soldItems.find((s) => s.saleId === saleId),
    [soldItems, saleId],
  );

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? soldItems.filter((s) =>
          `${s.product} ${s.customer ?? ""}`.toLowerCase().includes(term),
        )
      : soldItems;
    return list.slice(0, 30);
  }, [soldItems, search]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function onPickSale(s: SoldItem) {
    setSaleId(s.saleId);
    setQuantity(String(s.remainingQty));
    // Suggest refunding the full value of the units coming back.
    const unit = Number.parseFloat(s.unitPrice) || 0;
    setRefund((unit * s.remainingQty).toFixed(2));
    setOpen(false);
    setSearch("");
  }

  const qtyNum = Number.parseInt(quantity, 10);
  const overReturn =
    type === "ITEM" && selected ? qtyNum > selected.remainingQty : false;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="type" value={type} />

      {/* Return type */}
      <div>
        <Label>Return type</Label>
        <div className="flex gap-2">
          {(
            [
              ["ITEM", "Item return (back to stock)"],
              ["MONEY", "Money only (refund / change)"],
            ] as const
          ).map(([t, lbl]) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                type === t
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-400"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {type === "ITEM" ? (
        <>
          {/* Sold-item picker */}
          <input type="hidden" name="saleId" value={saleId} />
          <div ref={pickerRef} className="relative">
            <Label htmlFor="sale-search">Find the sold item</Label>
            {selected && !open ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={`${inputCls} flex items-center justify-between gap-3 text-left`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                    {selected.product}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {selected.customer ?? "Walk-in"} · sold {selected.soldOn} ·{" "}
                    {selected.remainingQty} of {selected.soldQty} returnable
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-brand-600 dark:text-brand-400">
                  Change
                </span>
              </button>
            ) : (
              <>
                <Input
                  id="sale-search"
                  type="search"
                  autoComplete="off"
                  placeholder="Search by product or customer…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                />
                {open && (
                  <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {matches.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        {soldItems.length === 0
                          ? "No returnable sales yet."
                          : `No sales match “${search}”.`}
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {matches.map((s) => (
                          <li key={s.saleId}>
                            <button
                              type="button"
                              onClick={() => onPickSale(s)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-50 dark:hover:bg-brand-400/10"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {s.product}
                                </span>
                                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                  {s.customer ?? "Walk-in"} · {s.soldOn} ·{" "}
                                  {formatMoney(s.unitPrice)}/unit
                                </span>
                              </span>
                              <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                {s.remainingQty}/{s.soldQty} left
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {selected && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="quantity">Units coming back</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max={selected.remainingQty}
                  step="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                {overReturn && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Only {selected.remainingQty} unit(s) can still be returned.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="refundAmount">Refund to customer (Rs.)</Label>
                <Input
                  id="refundAmount"
                  name="refundAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={refund}
                  onChange={(e) => setRefund(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Cash paid back — lower it if you keep a restocking fee.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="refundAmount-money">Refund amount (Rs.)</Label>
            <Input
              id="refundAmount-money"
              name="refundAmount"
              type="number"
              min="0"
              step="0.01"
              required
              value={refund}
              onChange={(e) => setRefund(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cash handed back to the customer — no stock is affected.
            </p>
          </div>
          <div>
            <Label htmlFor="customerId">Customer (optional)</Label>
            <select id="customerId" name="customerId" className={inputCls} defaultValue="">
              <option value="">Walk-in / not linked</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="e.g. faulty charger, customer changed mind" />
      </div>

      {/* Live summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Cash going out</span>
          <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
            {refund ? `− ${formatMoney(refund)}` : "—"}
          </span>
        </div>
        {type === "ITEM" && selected && (
          <div className="mt-1 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Back into stock</span>
            <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
              +{Number.isInteger(qtyNum) && qtyNum > 0 ? qtyNum : 0} {selected.product}
            </span>
          </div>
        )}
      </div>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Recording…">Record return</SubmitButton>
    </form>
  );
}
