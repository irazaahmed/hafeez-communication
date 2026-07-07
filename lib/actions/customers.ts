"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  requireAdmin,
  field,
  normalizePhone,
  type FormState,
} from "./utils";

/**
 * Upsert a customer by phone (the unique key). Used by the standalone customer
 * form and — via resolveCustomer — by the sale form's inline-add. Never
 * creates a duplicate for a phone that already exists.
 */
export async function saveCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const name = field(formData, "name");
  const phone = normalizePhone(field(formData, "phone"));

  if (!name) return { error: "Customer name is required." };
  if (!phone) return { error: "A valid phone number is required." };

  await prisma.customer.upsert({
    where: { phone },
    update: { name },
    create: { name, phone },
  });

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function updateCustomer(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const name = field(formData, "name");
  const phone = normalizePhone(field(formData, "phone"));

  if (!name) return { error: "Customer name is required." };
  if (!phone) return { error: "A valid phone number is required." };

  try {
    await prisma.customer.update({ where: { id }, data: { name, phone } });
  } catch {
    return { error: "Another customer already uses that phone number." };
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const [sales, mobiles, wallet] = await Promise.all([
    prisma.sale.count({ where: { customerId: id } }),
    prisma.mobile.count({ where: { soldToId: id } }),
    prisma.walletTransaction.count({ where: { customerId: id } }),
  ]);
  if (sales + mobiles + wallet > 0) {
    return { error: "Cannot delete a customer with linked sales, mobiles or wallet history." };
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
  return {};
}

/**
 * Resolve a customer for the sale/wallet/mobile forms, inside a transaction.
 * Priority: an explicit existing customerId, else inline name+phone which
 * upserts by phone. Returns the customer id, or null when none was provided.
 */
export async function resolveCustomer(
  tx: Prisma.TransactionClient,
  input: { customerId?: string | null; name?: string | null; phone?: string | null },
): Promise<string | null> {
  if (input.customerId) return input.customerId;

  const phone = normalizePhone(input.phone ?? "");
  const name = (input.name ?? "").trim();
  if (!phone) return null; // no customer attached to this transaction

  const customer = await tx.customer.upsert({
    where: { phone },
    update: name ? { name } : {},
    create: { name: name || "Walk-in customer", phone },
  });
  return customer.id;
}
