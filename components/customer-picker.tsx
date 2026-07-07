"use client";

import { useState } from "react";
import { Input, Label, inputCls } from "@/components/ui";

export type PickerCustomer = { id: string; name: string; phone: string };

/**
 * Shared optional-customer picker for the sale / wallet / mobile-sell forms.
 * Either pick an existing customer (submits `customerId`) or type a new
 * name + phone (submits `customerName` + `customerPhone`, which the server
 * upserts by phone). Leaving both empty means "no customer" (walk-in cash).
 */
export default function CustomerPicker({
  customers,
  label = "Customer (optional)",
}: {
  customers: PickerCustomer[];
  label?: string;
}) {
  const [existingId, setExistingId] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="customerId">{label}</Label>
        <select
          id="customerId"
          name="customerId"
          value={existingId}
          onChange={(e) => setExistingId(e.target.value)}
          className={inputCls}
        >
          <option value="">— Walk-in / add new below —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.phone}
            </option>
          ))}
        </select>
      </div>

      {existingId === "" && (
        <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 p-3 sm:grid-cols-2 dark:border-slate-700">
          <div>
            <Label htmlFor="customerName">New customer name</Label>
            <Input id="customerName" name="customerName" placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone</Label>
            <Input id="customerPhone" name="customerPhone" placeholder="03xx-xxxxxxx" />
          </div>
        </div>
      )}
    </div>
  );
}
