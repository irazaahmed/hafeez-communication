import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { currentCashBalance } from "@/lib/ledger";

/**
 * Daily business summary for the "evening hisab" — how much was sold, the cash
 * that should be in the drawer, and PROFIT broken out by source.
 *
 * Profit is a report-only analytic; it is derived here and NEVER written to the
 * cash ledger (the ledger is the single source of truth for cash only). Profit
 * is recognised on the day of the transaction (accrual) — a credit sale still
 * counts its full profit today even though not all cash was received.
 *
 *   Product sale profit = totalPrice − (unitCost × qty)   [cost snapshot on Sale]
 *   JazzCash / EasyPaisa profit = charges                  [the fee the shop keeps]
 *   Used-mobile profit = salePrice − purchasePrice         [realised on sale day]
 *   Expenses are counted separately and subtracted for the net.
 */

const zero = new Prisma.Decimal(0);

// Pakistan is UTC+5 with no daylight saving. "Today" for the shop must be
// measured against the Karachi wall clock, not the server's timezone (Vercel
// runs in UTC), otherwise the evening hisab would roll over 5 hours early.
const PK_OFFSET_MS = 5 * 60 * 60 * 1000;

/** The UTC instant of the most recent Pakistan-time midnight at or before `d`. */
function startOfPkDay(d: Date): Date {
  const pk = new Date(d.getTime() + PK_OFFSET_MS); // shift to PK wall clock
  const midnightPk = Date.UTC(
    pk.getUTCFullYear(),
    pk.getUTCMonth(),
    pk.getUTCDate(),
  );
  return new Date(midnightPk - PK_OFFSET_MS);
}

export type TodaySaleRow = {
  id: string;
  product: string;
  quantity: number;
  totalPrice: Prisma.Decimal;
  profit: Prisma.Decimal;
  paymentType: "CASH" | "CREDIT";
};

export type DailySummary = {
  cashInHand: Prisma.Decimal; // live ledger balance = "hard cash hona chahiye"

  // Product sales
  salesCount: number;
  salesRevenue: Prisma.Decimal;
  salesProfit: Prisma.Decimal;
  cashReceived: Prisma.Decimal; // cash actually collected on today's sales
  creditGiven: Prisma.Decimal; // amount left on udhaar from today's sales
  creditReceived: Prisma.Decimal; // payments received today against old udhaar

  // JazzCash / EasyPaisa
  walletCount: number;
  walletCharges: Prisma.Decimal; // = profit from wallet service

  // Used mobiles
  mobileCount: number;
  mobileRevenue: Prisma.Decimal;
  mobileProfit: Prisma.Decimal;

  // Returns / refunds (cash out; profit unwound)
  returnsCount: number;
  returnsRefund: Prisma.Decimal; // cash paid back to customers today
  returnsProfitReversed: Prisma.Decimal; // margin unwound today

  // Expenses (counted separately)
  expensesCount: number;
  expensesTotal: Prisma.Decimal;

  // Roll-ups
  grossProfit: Prisma.Decimal; // sales + wallet + mobile (before returns/expenses)
  netProfit: Prisma.Decimal; // grossProfit − returns − expenses

  sales: TodaySaleRow[]; // "aaj kya kya sale hua"
};

export async function getDailySummary(now: Date = new Date()): Promise<DailySummary> {
  const from = startOfPkDay(now);

  const [cashInHand, sales, wallet, mobiles, expenses, creditPayments, returns] =
    await Promise.all([
      currentCashBalance(prisma),
      prisma.sale.findMany({
        where: { createdAt: { gte: from } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quantity: true,
          unitCost: true,
          totalPrice: true,
          amountPaid: true,
          amountDue: true,
          paymentType: true,
          product: { select: { name: true } },
        },
      }),
      prisma.walletTransaction.findMany({
        where: { createdAt: { gte: from } },
        select: { charges: true },
      }),
      prisma.mobile.findMany({
        where: { status: "SOLD", soldAt: { gte: from } },
        select: { purchasePrice: true, salePrice: true },
      }),
      prisma.expense.findMany({
        where: { createdAt: { gte: from } },
        select: { amount: true },
      }),
      prisma.creditPayment.findMany({
        where: { createdAt: { gte: from } },
        select: { amount: true },
      }),
      prisma.return.findMany({
        where: { createdAt: { gte: from } },
        select: { refundAmount: true, profitReversed: true },
      }),
    ]);

  let salesRevenue = zero;
  let salesProfit = zero;
  let cashReceived = zero;
  let creditGiven = zero;
  const saleRows: TodaySaleRow[] = sales.map((s) => {
    const profit = s.totalPrice.minus(s.unitCost.mul(s.quantity));
    salesRevenue = salesRevenue.add(s.totalPrice);
    salesProfit = salesProfit.add(profit);
    cashReceived = cashReceived.add(s.amountPaid);
    creditGiven = creditGiven.add(s.amountDue);
    return {
      id: s.id,
      product: s.product.name,
      quantity: s.quantity,
      totalPrice: s.totalPrice,
      profit,
      paymentType: s.paymentType,
    };
  });

  const walletCharges = wallet.reduce((sum, w) => sum.add(w.charges), zero);

  let mobileRevenue = zero;
  let mobileProfit = zero;
  for (const m of mobiles) {
    const sale = m.salePrice ?? zero;
    mobileRevenue = mobileRevenue.add(sale);
    mobileProfit = mobileProfit.add(sale.minus(m.purchasePrice));
  }

  const expensesTotal = expenses.reduce((sum, e) => sum.add(e.amount), zero);
  const creditReceived = creditPayments.reduce((sum, c) => sum.add(c.amount), zero);

  const returnsRefund = returns.reduce((sum, r) => sum.add(r.refundAmount), zero);
  const returnsProfitReversed = returns.reduce(
    (sum, r) => sum.add(r.profitReversed),
    zero,
  );

  const grossProfit = salesProfit.add(walletCharges).add(mobileProfit);
  const netProfit = grossProfit.minus(returnsProfitReversed).minus(expensesTotal);

  return {
    cashInHand,
    salesCount: sales.length,
    salesRevenue,
    salesProfit,
    cashReceived,
    creditGiven,
    creditReceived,
    walletCount: wallet.length,
    walletCharges,
    mobileCount: mobiles.length,
    mobileRevenue,
    mobileProfit,
    returnsCount: returns.length,
    returnsRefund,
    returnsProfitReversed,
    expensesCount: expenses.length,
    expensesTotal,
    grossProfit,
    netProfit,
    sales: saleRows,
  };
}
