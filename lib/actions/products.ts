"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  requireAdmin,
  field,
  fieldOrNull,
  intField,
  moneyField,
  type FormState,
} from "./utils";

/**
 * Add stock. Matches an existing product on (name, company, variant) — if
 * found, increments quantity (restock); otherwise creates a new row.
 * (.claude/skills/stock-management). A findFirst + create/update is used
 * rather than upsert because Postgres treats NULL variants as distinct, so
 * upsert on a null-variant compound unique is unreliable.
 */
export async function addProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const name = field(formData, "name");
  const company = field(formData, "company");
  const variant = fieldOrNull(formData, "variant");
  const category = field(formData, "category");
  const costPrice = moneyField(formData, "costPrice");
  const salePrice = moneyField(formData, "salePrice");
  const quantity = intField(formData, "quantity");
  const imageUrl = fieldOrNull(formData, "imageUrl");

  if (!name || !company || !category)
    return { error: "Name, company and category are required." };
  if (!costPrice || costPrice.lt(0)) return { error: "Enter a valid cost price." };
  // Sale price is optional — the shop sets the price at sale time. If typed, it
  // must be a non-negative number (moneyField returns null for blank/invalid).
  if (salePrice && salePrice.lt(0)) return { error: "Sale price cannot be negative." };
  if (!Number.isInteger(quantity) || quantity < 0)
    return { error: "Enter a valid quantity." };

  const existing = await prisma.product.findFirst({
    where: { name, company, variant },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: quantity },
        // Restock refreshes prices/specs to the latest entered values.
        costPrice,
        salePrice,
        category,
        imageUrl,
      },
    });
  } else {
    await prisma.product.create({
      data: { name, company, variant, category, costPrice, salePrice, quantity, imageUrl },
    });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

/**
 * Edit an existing product's price/specs. Does NOT change quantity unless the
 * admin explicitly submits a new quantity value (empty = leave untouched).
 */
export async function updateProduct(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const name = field(formData, "name");
  const company = field(formData, "company");
  const variant = fieldOrNull(formData, "variant");
  const category = field(formData, "category");
  const costPrice = moneyField(formData, "costPrice");
  const salePrice = moneyField(formData, "salePrice");
  const imageUrl = fieldOrNull(formData, "imageUrl");
  const quantityRaw = field(formData, "quantity");

  if (!name || !company || !category)
    return { error: "Name, company and category are required." };
  if (!costPrice || costPrice.lt(0)) return { error: "Enter a valid cost price." };
  if (salePrice && salePrice.lt(0)) return { error: "Sale price cannot be negative." };

  const data: Prisma.ProductUpdateInput = {
    name,
    company,
    variant,
    category,
    costPrice,
    salePrice,
    imageUrl,
  };

  // Only overwrite quantity when the admin explicitly typed one.
  if (quantityRaw !== "") {
    const quantity = Number.parseInt(quantityRaw, 10);
    if (!Number.isInteger(quantity) || quantity < 0)
      return { error: "Enter a valid quantity." };
    data.quantity = quantity;
  }

  try {
    await prisma.product.update({ where: { id }, data });
  } catch {
    return { error: "Could not update — a product with these details may already exist." };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  // Products with recorded sales are kept for history; block the delete.
  const saleCount = await prisma.sale.count({ where: { productId: id } });
  if (saleCount > 0) {
    return { error: "Cannot delete a product that has sales history." };
  }
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  return {};
}
