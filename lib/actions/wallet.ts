"use server";

import { revalidatePath } from "next/cache";
import { Prisma, WalletTxnType, WalletProvider } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyAdminCredentials } from "@/lib/admin-auth";
import { appendCashLedger } from "@/lib/ledger";
import { resolveCustomer } from "./customers";
import { requireAdmin, field, moneyField, type FormState } from "./utils";

/**
 * Record a JazzCash / EasyPaisa transaction. cashEffect is ALWAYS recomputed
 * on the server from type/amount/charges — never trusted from the client
 * (.claude/skills/wallet-transactions):
 *   DEPOSIT  -> amount + charges
 *   TRANSFER -> charges
 *   WITHDRAW -> -(amount - charges)
 */
export async function createWalletTxn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const type = field(formData, "type") as WalletTxnType;
  const provider = field(formData, "provider") as WalletProvider;
  const amount = moneyField(formData, "amount");
  const charges = moneyField(formData, "charges") ?? new Prisma.Decimal(0);

  if (!Object.values(WalletProvider).includes(provider))
    return { error: "Select a provider." };
  if (!Object.values(WalletTxnType).includes(type))
    return { error: "Select a transaction type." };
  if (!amount || amount.lt(0)) return { error: "Enter a valid amount." };
  if (charges.lt(0)) return { error: "Charges cannot be negative." };

  let cashEffect: Prisma.Decimal;
  switch (type) {
    case WalletTxnType.DEPOSIT:
      cashEffect = amount.add(charges);
      break;
    case WalletTxnType.TRANSFER:
      cashEffect = charges;
      break;
    case WalletTxnType.WITHDRAW:
      cashEffect = amount.minus(charges).negated();
      break;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const customerId = await resolveCustomer(tx, {
        customerId: field(formData, "customerId") || null,
        name: field(formData, "customerName") || null,
        phone: field(formData, "customerPhone") || null,
      });

      const txn = await tx.walletTransaction.create({
        data: { type, provider, amount, charges, cashEffect, customerId },
      });
      await appendCashLedger(tx, {
        sourceType: "WALLET_TXN",
        sourceId: txn.id,
        amount: cashEffect,
        note: `${provider} ${type}`,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record the transaction." };
  }

  revalidatePath("/admin/wallet");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Delete a wallet transaction that was entered by mistake. Gated behind a
 * re-entered admin password so a stray click can't wipe out a real record.
 *
 * The transaction row is never hard-deleted and the original CashLedgerEntry
 * is never touched or removed — the ledger is append-only (.claude/skills/cash-ledger).
 * Instead this writes a reversing ledger entry for -cashEffect and soft-deletes
 * the WalletTransaction (deletedAt), so the audit trail and balanceAfter chain
 * both stay intact.
 */
export async function deleteWalletTxn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: "Not signed in." };

  const id = field(formData, "id");
  const password = field(formData, "password");
  if (!id) return { error: "Missing transaction id." };
  if (!password) return { error: "Enter your password to confirm deletion." };

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) return { error: "Incorrect password." };

  try {
    await prisma.$transaction(async (tx) => {
      const txn = await tx.walletTransaction.findUnique({ where: { id } });
      if (!txn) throw new Error("Transaction not found.");
      if (txn.deletedAt) throw new Error("This transaction was already deleted.");

      await appendCashLedger(tx, {
        sourceType: "WALLET_TXN",
        sourceId: txn.id,
        amount: txn.cashEffect.negated(),
        note: `Reversal: deleted ${txn.provider} ${txn.type}`,
      });

      await tx.walletTransaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete the transaction." };
  }

  revalidatePath("/admin/wallet");
  revalidatePath("/admin");
  revalidatePath("/admin/cash");
  return { ok: true };
}
