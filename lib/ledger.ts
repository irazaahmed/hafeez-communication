import { Prisma } from "@prisma/client";

/**
 * The ONE place cash movements are recorded. Every cash-affecting action must
 * call this exactly once, inside the same prisma.$transaction as its domain
 * write. See .claude/skills/cash-ledger.
 *
 * `amount` is signed: positive = cash in, negative = cash out.
 * `balanceAfter` = the previous entry's balanceAfter + amount (0 if first).
 *
 * `tx` is the Prisma transaction client — passing the outer `prisma` here
 * would break atomicity, so callers must be inside `$transaction`.
 */
export type CashSourceType =
  | "SALE"
  | "CREDIT_PAYMENT"
  | "EXPENSE"
  | "WALLET_TXN"
  | "MOBILE_PURCHASE"
  | "MOBILE_SALE"
  | "RETURN"
  | "SESSION_OPEN"
  | "SESSION_CLOSE"
  | "MANUAL";

export async function appendCashLedger(
  tx: Prisma.TransactionClient,
  entry: {
    sourceType: CashSourceType;
    sourceId?: string | null;
    amount: Prisma.Decimal | number | string;
    note?: string | null;
  },
) {
  const amount = new Prisma.Decimal(entry.amount);

  // Read the latest balance INSIDE the transaction so concurrent writes are
  // serialized by the surrounding $transaction rather than racing.
  const last = await tx.cashLedgerEntry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { balanceAfter: true },
  });
  const previous = last?.balanceAfter ?? new Prisma.Decimal(0);
  const balanceAfter = previous.add(amount);

  return tx.cashLedgerEntry.create({
    data: {
      sourceType: entry.sourceType,
      sourceId: entry.sourceId ?? null,
      amount,
      balanceAfter,
      note: entry.note ?? null,
    },
  });
}

/** Live running cash balance = balanceAfter of the most recent entry (0 if none). */
export async function currentCashBalance(
  client: { cashLedgerEntry: Prisma.TransactionClient["cashLedgerEntry"] },
): Promise<Prisma.Decimal> {
  const last = await client.cashLedgerEntry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { balanceAfter: true },
  });
  return last?.balanceAfter ?? new Prisma.Decimal(0);
}
