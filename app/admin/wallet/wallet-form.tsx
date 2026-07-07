"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createWalletTxn } from "@/lib/actions/wallet";
import type { FormState } from "@/lib/actions/utils";
import {
  FormError,
  FormSuccess,
  Input,
  Label,
  SubmitButton,
  inputCls,
} from "@/components/ui";
import CustomerPicker, { type PickerCustomer } from "@/components/customer-picker";
import { formatMoney } from "@/lib/format";

type TxnType = "DEPOSIT" | "TRANSFER" | "WITHDRAW";

/** Mirrors the server formula (.claude/skills/wallet-transactions). Preview only. */
function previewCashEffect(type: TxnType, amount: number, charges: number): number {
  switch (type) {
    case "DEPOSIT":
      return amount + charges;
    case "TRANSFER":
      return charges;
    case "WITHDRAW":
      return -(amount - charges);
  }
}

export default function WalletForm({ customers }: { customers: PickerCustomer[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(createWalletTxn, undefined);
  const [type, setType] = useState<TxnType>("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [charges, setCharges] = useState("");

  const effect = previewCashEffect(
    type,
    Number.parseFloat(amount) || 0,
    Number.parseFloat(charges) || 0,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="provider">Provider</Label>
          <select id="provider" name="provider" required className={inputCls} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA">EasyPaisa</option>
          </select>
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as TxnType)}
            className={inputCls}
          >
            <option value="DEPOSIT">Deposit (cash in → wallet)</option>
            <option value="TRANSFER">Transfer / send money</option>
            <option value="WITHDRAW">Withdraw (wallet → cash out)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="amount">Amount (Rs.)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="charges">Charges / fee (Rs.)</Label>
          <Input
            id="charges"
            name="charges"
            type="number"
            min="0"
            step="0.01"
            value={charges}
            onChange={(e) => setCharges(e.target.value)}
          />
        </div>
      </div>

      <CustomerPicker customers={customers} />

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <span className="text-slate-500 dark:text-slate-400">Effect on cash drawer</span>
        <span
          className={`font-semibold tabular-nums ${
            effect >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {effect >= 0 ? "+" : "−"}
          {formatMoney(Math.abs(effect))}
        </span>
      </div>

      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Transaction recorded." />}
      <SubmitButton pendingText="Recording…">Record transaction</SubmitButton>
    </form>
  );
}
