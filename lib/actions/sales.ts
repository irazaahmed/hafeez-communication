"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, PaymentType, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
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
        select: { id: true, amountPaid: true, amountDue: true },
      });
      if (!sale) throw new Error("Sale not found.");
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
