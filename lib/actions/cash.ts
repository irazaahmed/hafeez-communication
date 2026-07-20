"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendCashLedger, currentCashBalance } from "@/lib/ledger";
import { requireAdmin, moneyField, type FormState } from "./utils";

/**
 * Open a cash session (.claude/skills/cash-ledger). Only one session may be
 * open at a time.
 *
 * `openingAmount` is the actual total cash the admin is starting the drawer
 * with today — NOT an amount to add on top of the running balance (the
 * running balance already carries forward everything from before, cash is
 * never zeroed between sessions). The ledger only needs the DELTA versus the
 * last known cash state: if today's opening amount matches it exactly,
 * nothing moved and no cash effect is recorded; if it's higher, the
 * difference was added; if lower, the difference was removed.
 *
 * "Last known cash state" is the last CLOSED session's `closingAmount` when
 * one exists (the physical count from that reconciliation, which may differ
 * from the ledger if there was a shortage/excess). If no session has ever
 * been closed — the very first session, or any stray activity was recorded
 * without a session wrapping it — it falls back to the live running balance
 * (`currentCashBalance`), since that's the best available expectation.
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
      const baseline = lastClosed
        ? (lastClosed.closingAmount ?? new Prisma.Decimal(0))
        : await currentCashBalance(tx);
      const delta = openingAmount.minus(baseline);

      const session = await tx.cashSession.create({ data: { openingAmount } });
      await appendCashLedger(tx, {
        sourceType: "SESSION_OPEN",
        sourceId: session.id,
        amount: delta,
        note: delta.isZero()
          ? `Opening float: same as last known balance (${baseline.toString()}), no change`
          : `Opening float: ${delta.gt(0) ? "added" : "removed"} ${delta.abs().toString()} vs last known balance (${baseline.toString()})`,
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
 * Close the open cash session. expectedAmount is the live running cash
 * balance right now (the single source of truth — see currentCashBalance),
 * NOT a sum scoped to since-open: the ledger already carries every prior
 * session's true count forward, so the running balance IS what should be in
 * the drawer. difference = countedCash - expectedAmount. The reconciliation
 * does NOT move cash, so the SESSION_CLOSE audit entry has amount 0 (balance
 * unchanged).
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

      const expectedAmount = await currentCashBalance(tx);
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
