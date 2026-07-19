"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, PaymentType, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyAdminCredentials } from "@/lib/admin-auth";
import { appendCashLedger } from "@/lib/ledger";
import { resolveCustomer } from "./customers";
import { requireAdmin, field, intField, moneyField, type FormState } from "./utils";

/**
 * Fast single-item sale entry (.claude/skills/sale-entry). One Sale row, cash
 * or credit. Stock decrement, Sale insert, and the +amountPaid cash-ledger
 * entry all happen in ONE transaction. Negative stock is hard-blocked.
 */
export async function createSale(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const productId = field(formData, "productId");
  const quantity = intField(formData, "quantity");
  const unitPrice = moneyField(formData, "unitPrice");
  const paymentType =
    field(formData, "paymentType") === "CREDIT"
      ? PaymentType.CREDIT
      : PaymentType.CASH;

  if (!productId) return { error: "Select a product." };
  if (!Number.isInteger(quantity) || quantity <= 0)
    return { error: "Enter a valid quantity." };
  if (!unitPrice || unitPrice.lte(0)) return { error: "Enter a valid unit price." };

  const totalPrice = unitPrice.mul(quantity);

  // For credit, admin may enter a part payment (0..totalPrice). Cash = full.
  let amountPaid: Prisma.Decimal;
  if (paymentType === PaymentType.CASH) {
    amountPaid = totalPrice;
  } else {
    const entered = moneyField(formData, "amountPaid") ?? new Prisma.Decimal(0);
    if (entered.lt(0) || entered.gt(totalPrice))
      return { error: "Amount paid must be between 0 and the total." };
    amountPaid = entered;
  }
  const amountDue = totalPrice.minus(amountPaid);
  const paymentStatus = amountDue.isZero()
    ? PaymentStatus.PAID
    : amountPaid.isZero()
      ? PaymentStatus.UNPAID
      : PaymentStatus.PARTIAL;

  let saleId: string;
  try {
    saleId = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, quantity: true, costPrice: true },
      });
      if (!product) throw new Error("Product not found.");
      if (product.quantity - quantity < 0)
        throw new Error(`Only ${product.quantity} in stock — cannot sell ${quantity}.`);

      const customerId = await resolveCustomer(tx, {
        customerId: field(formData, "customerId") || null,
        name: field(formData, "customerName") || null,
        phone: field(formData, "customerPhone") || null,
      });

      const sale = await tx.sale.create({
        data: {
          productId,
          quantity,
          unitPrice,
          // Snapshot cost now so profit stays correct after future restocks.
          unitCost: product.costPrice,
          totalPrice,
          customerId,
          paymentType,
          amountPaid,
          amountDue,
          paymentStatus,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { quantity: { decrement: quantity } },
      });

      // Only the cash actually received hits the drawer.
      if (amountPaid.gt(0)) {
        await appendCashLedger(tx, {
          sourceType: "SALE",
          sourceId: sale.id,
          amount: amountPaid,
          note: `Sale x${quantity}`,
        });
      }

      return sale.id;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the sale." };
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  redirect(`/admin/sales/${saleId}/invoice`);
}

/**
 * Record a payment against an existing credit sale (.claude/skills/
 * credit-and-invoicing). Bound as recordCreditPayment.bind(null, saleId).
 */
export async function recordCreditPayment(
  saleId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const amount = moneyField(formData, "amount");
  if (!amount || amount.lte(0)) return { error: "Enter a valid amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        select: { id: true, amountPaid: true, amountDue: true, deletedAt: true },
      });
      if (!sale) throw new Error("Sale not found.");
      if (sale.deletedAt) throw new Error("This sale was deleted.");
      if (amount.gt(sale.amountDue))
        throw new Error(`Amount exceeds the pending Rs. ${sale.amountDue.toString()}.`);

      const newPaid = sale.amountPaid.add(amount);
      const newDue = sale.amountDue.minus(amount);
      const status = newDue.isZero() ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

      await tx.creditPayment.create({ data: { saleId, amount } });
      await tx.sale.update({
        where: { id: saleId },
        data: { amountPaid: newPaid, amountDue: newDue, paymentStatus: status },
      });
      await appendCashLedger(tx, {
        sourceType: "CREDIT_PAYMENT",
        sourceId: saleId,
        amount,
        note: "Credit payment received",
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the payment." };
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin");
  revalidatePath(`/admin/sales/${saleId}/invoice`);
  return { ok: true };
}

/**
 * Correct a mistaken sale (wrong qty/price/payment/customer typo). Bound as
 * updateSale.bind(null, saleId). Locked once the sale has a credit payment or
 * a return against it — those already depend on the original totals/quantity,
 * so changing them here would silently desync the math (see
 * /admin/sales/[id]/edit/page.tsx, which shows why editing is unavailable).
 *
 * Stock and cash both move by the *delta* between old and new values, in the
 * same transaction as the Sale update, so both stay exactly correct:
 *   - Product.quantity adjusts by (oldQuantity - newQuantity)
 *   - one CashLedgerEntry captures (newAmountPaid - oldAmountPaid)
 */
export async function updateSale(
  saleId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const quantity = intField(formData, "quantity");
  const unitPrice = moneyField(formData, "unitPrice");
  const paymentType =
    field(formData, "paymentType") === "CREDIT" ? PaymentType.CREDIT : PaymentType.CASH;

  if (!Number.isInteger(quantity) || quantity <= 0)
    return { error: "Enter a valid quantity." };
  if (!unitPrice || unitPrice.lte(0)) return { error: "Enter a valid unit price." };

  const totalPrice = unitPrice.mul(quantity);

  let amountPaid: Prisma.Decimal;
  if (paymentType === PaymentType.CASH) {
    amountPaid = totalPrice;
  } else {
    const entered = moneyField(formData, "amountPaid") ?? new Prisma.Decimal(0);
    if (entered.lt(0) || entered.gt(totalPrice))
      return { error: "Amount paid must be between 0 and the total." };
    amountPaid = entered;
  }
  const amountDue = totalPrice.minus(amountPaid);
  const paymentStatus = amountDue.isZero()
    ? PaymentStatus.PAID
    : amountPaid.isZero()
      ? PaymentStatus.UNPAID
      : PaymentStatus.PARTIAL;

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { _count: { select: { payments: true, returns: true } } },
      });
      if (!sale) throw new Error("Sale not found.");
      if (sale.deletedAt) throw new Error("This sale was deleted.");
      if (sale._count.returns > 0)
        throw new Error("This sale has a return recorded against it — it can't be edited.");
      if (sale._count.payments > 0)
        throw new Error(
          "This sale already has credit payments recorded — it can't be edited. Delete it and re-enter instead if it was a genuine mistake.",
        );

      const product = await tx.product.findUnique({
        where: { id: sale.productId },
        select: { id: true, quantity: true },
      });
      if (!product) throw new Error("Product not found.");

      // quantityDelta > 0 means the corrected sale takes MORE stock than before.
      const quantityDelta = quantity - sale.quantity;
      const newProductQuantity = product.quantity - quantityDelta;
      if (newProductQuantity < 0)
        throw new Error(`Only ${product.quantity + sale.quantity} unit(s) available for this sale.`);

      const customerId = await resolveCustomer(tx, {
        customerId: field(formData, "customerId") || null,
        name: field(formData, "customerName") || null,
        phone: field(formData, "customerPhone") || null,
      });

      const cashDelta = amountPaid.minus(sale.amountPaid);

      await tx.product.update({
        where: { id: product.id },
        data: { quantity: newProductQuantity },
      });

      await tx.sale.update({
        where: { id: saleId },
        data: {
          quantity,
          unitPrice,
          totalPrice,
          paymentType,
          amountPaid,
          amountDue,
          paymentStatus,
          customerId,
        },
      });

      if (!cashDelta.isZero()) {
        await appendCashLedger(tx, {
          sourceType: "SALE",
          sourceId: saleId,
          amount: cashDelta,
          note: "Edit: corrected sale amount",
        });
      }
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update the sale." };
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin/products");
  revalidatePath("/admin/credits");
  revalidatePath("/admin");
  revalidatePath(`/admin/sales/${saleId}/invoice`);
  redirect(`/admin/sales/${saleId}/invoice`);
}

/**
 * Delete a sale entered by mistake. Gated behind a re-entered admin password
 * so a stray click can't wipe out a real record (same pattern as
 * deleteWalletTxn in lib/actions/wallet.ts).
 *
 * Blocked when a return exists against this sale — the return already put
 * some of the quantity back into stock, so restoring the FULL original
 * quantity here would double-count it. Reverse the return first.
 *
 * The Sale row is soft-deleted (deletedAt), never hard-deleted, and the
 * original CashLedgerEntry rows are never touched (append-only ledger, see
 * .claude/skills/cash-ledger). Instead:
 *   - the full sale.quantity goes back into Product stock
 *   - a reversing CashLedgerEntry undoes sale.amountPaid, which already
 *     includes both the original payment AND any credit payments recorded
 *     since (recordCreditPayment increments Sale.amountPaid), so one entry
 *     correctly reverses all cash this sale ever brought in.
 */
export async function deleteSale(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: "Not signed in." };

  const id = field(formData, "id");
  const password = field(formData, "password");
  if (!id) return { error: "Missing sale id." };
  if (!password) return { error: "Enter your password to confirm deletion." };

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) return { error: "Incorrect password." };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { _count: { select: { returns: true } } },
      });
      if (!sale) throw new Error("Sale not found.");
      if (sale.deletedAt) throw new Error("This sale was already deleted.");
      if (sale._count.returns > 0)
        throw new Error("This sale has a return recorded against it — reverse the return first.");

      await tx.product.update({
        where: { id: sale.productId },
        data: { quantity: { increment: sale.quantity } },
      });

      if (sale.amountPaid.gt(0)) {
        await appendCashLedger(tx, {
          sourceType: "SALE",
          sourceId: sale.id,
          amount: sale.amountPaid.negated(),
          note: `Reversal: deleted sale x${sale.quantity}`,
        });
      }

      await tx.sale.update({ where: { id }, data: { deletedAt: new Date() } });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete the sale." };
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin/products");
  revalidatePath("/admin/credits");
  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  return { ok: true };
}
