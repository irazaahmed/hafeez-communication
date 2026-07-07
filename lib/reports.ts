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

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

  // Expenses (counted separately)
  expensesCount: number;
  expensesTotal: Prisma.Decimal;

  // Roll-ups
  grossProfit: Prisma.Decimal; // sales + wallet + mobile (before expenses)
  netProfit: Prisma.Decimal; // grossProfit − expenses

  sales: TodaySaleRow[]; // "aaj kya kya sale hua"
};

export async function getDailySummary(now: Date = new Date()): Promise<DailySummary> {
  const from = startOfDay(now);

  const [cashInHand, sales, wallet, mobiles, expenses, creditPayments] =
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

  const grossProfit = salesProfit.add(walletCharges).add(mobileProfit);
  const netProfit = grossProfit.minus(expensesTotal);

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
    expensesCount: expenses.length,
    expensesTotal,
    grossProfit,
    netProfit,
    sales: saleRows,
  };
}
