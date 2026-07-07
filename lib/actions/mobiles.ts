"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MobileStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendCashLedger } from "@/lib/ledger";
import { resolveCustomer } from "./customers";
import {
  requireAdmin,
  field,
  fieldOrNull,
  moneyField,
  type FormState,
} from "./utils";

/**
 * Used-phone buy (.claude/skills/mobile-inventory). Independent of Product —
 * touches no product/sale tables. Creates Mobile(IN_STOCK) + a -purchasePrice
 * cash-ledger entry in one transaction.
 */
export async function buyMobile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const model = field(formData, "model");
  const imei = fieldOrNull(formData, "imei");
  const purchasedFrom = field(formData, "purchasedFrom");
  const purchasePrice = moneyField(formData, "purchasePrice");

  if (!model) return { error: "Enter the phone model." };
  if (!purchasedFrom) return { error: "Enter who it was purchased from." };
  if (!purchasePrice || purchasePrice.lte(0))
    return { error: "Enter a valid purchase price." };

  try {
    await prisma.$transaction(async (tx) => {
      const mobile = await tx.mobile.create({
        data: { model, imei, purchasedFrom, purchasePrice, status: MobileStatus.IN_STOCK },
      });
      await appendCashLedger(tx, {
        sourceType: "MOBILE_PURCHASE",
        sourceId: mobile.id,
        amount: purchasePrice.negated(),
        note: `Bought ${model}`,
      });
    });
  } catch (err) {
    // Most likely a duplicate IMEI (unique).
    return {
      error: err instanceof Error && err.message.includes("Unique")
        ? "A mobile with that IMEI already exists."
        : "Could not record the purchase.",
    };
  }

  revalidatePath("/admin/mobiles");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Sell an in-stock mobile. Sets SOLD + sale details and writes a +salePrice
 * cash-ledger entry. Blocks selling an already-sold handset.
 */
export async function sellMobile(
  mobileId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const salePrice = moneyField(formData, "salePrice");
  if (!salePrice || salePrice.lte(0)) return { error: "Enter a valid sale price." };

  try {
    await prisma.$transaction(async (tx) => {
      const mobile = await tx.mobile.findUnique({
        where: { id: mobileId },
        select: { id: true, status: true, model: true },
      });
      if (!mobile) throw new Error("Mobile not found.");
      if (mobile.status === MobileStatus.SOLD)
        throw new Error("This mobile is already sold.");

      const customerId = await resolveCustomer(tx, {
        customerId: field(formData, "customerId") || null,
        name: field(formData, "customerName") || null,
        phone: field(formData, "customerPhone") || null,
      });

      await tx.mobile.update({
        where: { id: mobileId },
        data: {
          status: MobileStatus.SOLD,
          salePrice,
          soldToId: customerId,
          soldAt: new Date(),
        },
      });
      await appendCashLedger(tx, {
        sourceType: "MOBILE_SALE",
        sourceId: mobileId,
        amount: salePrice,
        note: `Sold ${mobile.model}`,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the sale." };
  }

  revalidatePath("/admin/mobiles");
  revalidatePath("/admin");
  redirect("/admin/mobiles");
}
