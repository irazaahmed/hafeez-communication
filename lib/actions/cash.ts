"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendCashLedger } from "@/lib/ledger";
import { requireAdmin, moneyField, type FormState } from "./utils";

/**
 * Open a cash session (.claude/skills/cash-ledger). Only one session may be
 * open at a time.
 *
 * `openingAmount` is the actual total cash the admin is starting the drawer
 * with today — NOT an amount to add on top of the running balance (the
 * running balance already carries forward everything from before, cash is
 * never zeroed between sessions). The ledger only needs the DELTA versus what
 * the last session closed at: if today's opening amount matches the last
 * closing amount exactly, nothing moved and no cash effect is recorded; if
 * it's higher, the difference was added; if lower, the difference was
 * removed. The very first session ever (no prior closed session) has no
 * baseline, so its full opening amount is the delta.
 */
export async function openSession(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const openingAmount = moneyField(formData, "openingAmount");
  if (!openingAmount || openingAmount.lt(0))
    return { error: "Enter a valid opening amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const openCount = await tx.cashSession.count({ where: { closedAt: null } });
      if (openCount > 0) throw new Error("A cash session is already open.");

      const lastClosed = await tx.cashSession.findFirst({
        where: { closedAt: { not: null } },
        orderBy: { closedAt: "desc" },
      });
      const lastClosingAmount = lastClosed?.closingAmount ?? new Prisma.Decimal(0);
      const delta = openingAmount.minus(lastClosingAmount);

      const session = await tx.cashSession.create({ data: { openingAmount } });
      await appendCashLedger(tx, {
        sourceType: "SESSION_OPEN",
        sourceId: session.id,
        amount: delta,
        note: delta.isZero()
          ? `Opening float: same as last close (${lastClosingAmount.toString()}), no change`
          : `Opening float: ${delta.gt(0) ? "added" : "removed"} ${delta.abs().toString()} vs last close (${lastClosingAmount.toString()})`,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open the session." };
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Close the open cash session. expectedAmount = sum of ledger movements since
 * the session opened (this already includes the opening float).
 * difference = countedCash - expectedAmount. The reconciliation does NOT move
 * cash, so the SESSION_CLOSE audit entry has amount 0 (balance unchanged).
 */
export async function closeSession(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const closingAmount = moneyField(formData, "closingAmount");
  if (!closingAmount || closingAmount.lt(0))
    return { error: "Enter the counted cash amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const session = await tx.cashSession.findFirst({ where: { closedAt: null } });
      if (!session) throw new Error("No open cash session to close.");

      const agg = await tx.cashLedgerEntry.aggregate({
        where: { createdAt: { gte: session.openedAt } },
        _sum: { amount: true },
      });
      const expectedAmount = agg._sum.amount ?? new Prisma.Decimal(0);
      const difference = closingAmount.minus(expectedAmount);

      await tx.cashSession.update({
        where: { id: session.id },
        data: {
          closedAt: new Date(),
          closingAmount,
          expectedAmount,
          difference,
        },
      });

      // Audit-only marker — must not alter the running balance.
      await appendCashLedger(tx, {
        sourceType: "SESSION_CLOSE",
        sourceId: session.id,
        amount: 0,
        note: `Counted ${closingAmount.toString()} vs expected ${expectedAmount.toString()} (diff ${difference.toString()})`,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not close the session." };
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  return { ok: true };
}
