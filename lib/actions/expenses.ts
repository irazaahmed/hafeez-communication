"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { appendCashLedger } from "@/lib/ledger";
import {
  requireAdmin,
  field,
  fieldOrNull,
  moneyField,
  type FormState,
} from "./utils";

/**
 * Record a shop expense. Creates Expense + a -amount cash-ledger entry in one
 * transaction (.claude/skills/cash-ledger).
 */
export async function createExpense(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const category = field(formData, "category");
  const amount = moneyField(formData, "amount");
  const note = fieldOrNull(formData, "note");

  if (!category) return { error: "Enter an expense category." };
  if (!amount || amount.lte(0)) return { error: "Enter a valid amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({ data: { category, amount, note } });
      await appendCashLedger(tx, {
        sourceType: "EXPENSE",
        sourceId: expense.id,
        amount: amount.negated(),
        note: note ?? category,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the expense." };
  }

  revalidatePath("/admin/expenses");
  revalidatePath("/admin");
  return { ok: true };
}
