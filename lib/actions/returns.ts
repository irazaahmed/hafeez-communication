"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, ReturnType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendCashLedger } from "@/lib/ledger";
import { requireAdmin, field, intField, moneyField, type FormState } from "./utils";

/**
 * Record a return / refund. Cash always leaves the drawer (one negative
 * RETURN ledger entry). Two flavours:
 *
 *  - ITEM:  a sold product is handed back. It goes BACK into stock, the
 *           customer is refunded, and the sale margin is unwound in reports
 *           (profitReversed). Validated against the original Sale so you can't
 *           return more units than were sold.
 *  - MONEY: a plain cash refund / change with no stock movement. The whole
 *           refund is treated as a profit reversal for the day.
 *
 * Profit figures are report-only (subtracted by getDailySummary) — they never
 * hit the cash ledger, which stays a pure record of physical cash.
 */
export async function createReturn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const type =
    field(formData, "type") === "MONEY" ? ReturnType.MONEY : ReturnType.ITEM;
  const refundAmount = moneyField(formData, "refundAmount");
  const note = field(formData, "note") || null;

  if (!refundAmount || refundAmount.lt(0))
    return { error: "Enter a valid refund amount." };

  try {
    await prisma.$transaction(async (tx) => {
      let productId: string | null = null;
      let customerId: string | null = null;
      let quantity = 0;
      let unitCost = new Prisma.Decimal(0);
      let profitReversed = refundAmount; // MONEY: whole refund is a loss
      let saleId: string | null = null;

      if (type === ReturnType.ITEM) {
        saleId = field(formData, "saleId") || null;
        quantity = intField(formData, "quantity");
        if (!saleId) throw new Error("Select the sale being returned.");
        if (!Number.isInteger(quantity) || quantity < 1)
          throw new Error("Enter how many units are coming back (at least 1).");

        const sale = await tx.sale.findUnique({
          where: { id: saleId },
          select: { id: true, productId: true, customerId: true, quantity: true, unitCost: true, deletedAt: true },
        });
        if (!sale) throw new Error("Original sale not found.");
        if (sale.deletedAt) throw new Error("This sale was deleted and can't be returned against.");

        // Don't allow returning more than was sold (across all prior returns).
        const prior = await tx.return.aggregate({
          where: { saleId, type: ReturnType.ITEM },
          _sum: { quantity: true },
        });
        const alreadyReturned = prior._sum.quantity ?? 0;
        if (alreadyReturned + quantity > sale.quantity)
          throw new Error(
            `Only ${sale.quantity - alreadyReturned} unit(s) can still be returned from this sale.`,
          );

        productId = sale.productId;
        customerId = sale.customerId;
        unitCost = sale.unitCost;
        // Margin unwound = cash paid back minus the cost of the goods coming back.
        profitReversed = refundAmount.minus(unitCost.mul(quantity));

        // Item back into stock.
        await tx.product.update({
          where: { id: productId },
          data: { quantity: { increment: quantity } },
        });
      } else {
        customerId = field(formData, "customerId") || null;
      }

      const ret = await tx.return.create({
        data: {
          type,
          saleId,
          productId,
          quantity,
          unitCost,
          refundAmount,
          profitReversed,
          customerId,
          note,
        },
      });

      // Physical cash out (only if money actually changes hands).
      if (refundAmount.gt(0)) {
        await appendCashLedger(tx, {
          sourceType: "RETURN",
          sourceId: ret.id,
          amount: refundAmount.negated(),
          note: type === ReturnType.ITEM ? `Item return x${quantity}` : "Cash refund",
        });
      }
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the return." };
  }

  revalidatePath("/admin/returns");
  revalidatePath("/admin/products");
  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  redirect("/admin/returns");
}
