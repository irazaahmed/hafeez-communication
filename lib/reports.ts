import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { currentCashBalance } from "@/lib/ledger";
import { pkMonthRange, monthLabel, pkDateRange } from "@/lib/format";

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

/** Profit/activity breakdown for an arbitrary date range — no cash balance. */
export type PeriodProfit = {
  // Product sales
  salesCount: number;
  salesRevenue: Prisma.Decimal;
  salesProfit: Prisma.Decimal;
  cashReceived: Prisma.Decimal; // cash actually collected on the period's sales
  creditGiven: Prisma.Decimal; // amount left on udhaar from the period's sales
  creditReceived: Prisma.Decimal; // payments received against old udhaar

  // JazzCash / EasyPaisa
  walletCount: number;
  walletCharges: Prisma.Decimal; // = profit from wallet service

  // Used mobiles
  mobileCount: number;
  mobileRevenue: Prisma.Decimal;
  mobileProfit: Prisma.Decimal;

  // Returns / refunds (cash out; profit unwound)
  returnsCount: number;
  returnsRefund: Prisma.Decimal; // cash paid back to customers
  returnsProfitReversed: Prisma.Decimal; // margin unwound

  // Expenses (counted separately)
  expensesCount: number;
  expensesTotal: Prisma.Decimal;

  // Roll-ups
  grossProfit: Prisma.Decimal; // sales + wallet + mobile (before returns/expenses)
  netProfit: Prisma.Decimal; // grossProfit − returns − expenses

  sales: TodaySaleRow[]; // every sale in the period, newest first
};

/**
 * Shared aggregation behind getDailySummary/getMonthlyProfitReport/
 * getMonthlyProfitHistory. Profit is never stored — it's derived here from
 * Sale/WalletTransaction/Mobile/Return/Expense rows every time, same as the
 * daily hisab always worked, just parameterised by range instead of "today".
 */
async function computePeriodProfit(gte: Date, lt?: Date): Promise<PeriodProfit> {
  const createdAt = lt ? { gte, lt } : { gte };

  const [sales, wallet, mobiles, expenses, creditPayments, returns] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt, deletedAt: null },
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
      where: { createdAt },
      select: { charges: true },
    }),
    prisma.mobile.findMany({
      where: { status: "SOLD", soldAt: createdAt },
      select: { purchasePrice: true, salePrice: true },
    }),
    prisma.expense.findMany({
      where: { createdAt },
      select: { amount: true },
    }),
    prisma.creditPayment.findMany({
      where: { createdAt },
      select: { amount: true },
    }),
    prisma.return.findMany({
      where: { createdAt },
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

export type DailySummary = PeriodProfit & {
  cashInHand: Prisma.Decimal; // live ledger balance = "hard cash hona chahiye"
};

export async function getDailySummary(now: Date = new Date()): Promise<DailySummary> {
  const from = startOfPkDay(now);
  const [cashInHand, period] = await Promise.all([
    currentCashBalance(prisma),
    computePeriodProfit(from),
  ]);
  return { cashInHand, ...period };
}

export type MonthlyProfitReport = PeriodProfit & {
  month: string; // "yyyy-mm"
  label: string; // "July 2026"
};

/** Full profit breakdown (with per-sale rows) for one Pakistan-time calendar month. */
export async function getMonthlyProfitReport(monthStr: string): Promise<MonthlyProfitReport> {
  const { gte, lt } = pkMonthRange(monthStr);
  const period = await computePeriodProfit(gte, lt);
  return { month: monthStr, label: monthLabel(monthStr), ...period };
}

export type RangeProfitReport = PeriodProfit & {
  from: string; // "yyyy-mm-dd"
  to: string; // "yyyy-mm-dd"
};

/** Full profit breakdown (with per-sale rows) for an arbitrary Pakistan-time date range, inclusive of both ends. */
export async function getRangeProfitReport(fromStr: string, toStr: string): Promise<RangeProfitReport> {
  const { gte, lt } = pkDateRange(fromStr, toStr);
  const period = await computePeriodProfit(gte, lt);
  return { from: fromStr, to: toStr, ...period };
}

export type MonthlyProfitTotals = Omit<MonthlyProfitReport, "sales">;

/** Last `monthsBack` calendar months (most recent first), totals only — for a trend table. */
export async function getMonthlyProfitHistory(monthsBack = 12): Promise<MonthlyProfitTotals[]> {
  const months = monthsBackList(monthsBack);
  return Promise.all(
    months.map(async (month) => {
      const { gte, lt } = pkMonthRange(month);
      const { sales, ...totals } = await computePeriodProfit(gte, lt);
      void sales; // history rows only need totals, not the per-sale list
      return { month, label: monthLabel(month), ...totals };
    }),
  );
}

/** ["2026-07", "2026-06", ...] — n calendar months ending with the current PK month. */
function monthsBackList(n: number): string[] {
  const pk = new Date(Date.now() + PK_OFFSET_MS);
  let y = pk.getUTCFullYear();
  let m = pk.getUTCMonth() + 1; // 1-12
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}
