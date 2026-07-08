import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { DailySummary } from "@/lib/reports";

/**
 * "Today's business" panel — the evening hisab. Shows what sold, the cash that
 * should be in the drawer, and profit broken out by source (sales, JazzCash /
 * EasyPaisa charges, used mobiles) with expenses counted separately.
 * Purely presentational; all figures come from getDailySummary().
 */
export default function DailySummaryCard({ summary }: { summary: DailySummary }) {
  const s = summary;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Today&apos;s business
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Sales, cash &amp; profit for today — the evening hisab
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Net profit
          </p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              s.netProfit.gte(0)
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatMoney(s.netProfit)}
          </p>
        </div>
      </div>

      {/* Profit sources */}
      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-5 dark:bg-slate-800">
        <ProfitTile
          label="Sales profit"
          value={s.salesProfit}
          sub={`${s.salesCount} sale${s.salesCount === 1 ? "" : "s"} · ${formatMoney(s.salesRevenue)}`}
        />
        <ProfitTile
          label="JC / EP charges"
          value={s.walletCharges}
          sub={`${s.walletCount} txn${s.walletCount === 1 ? "" : "s"}`}
        />
        <ProfitTile
          label="Mobile profit"
          value={s.mobileProfit}
          sub={`${s.mobileCount} sold · ${formatMoney(s.mobileRevenue)}`}
        />
        <ProfitTile
          label="Returns / refunds"
          value={s.returnsProfitReversed.negated()}
          sub={`${s.returnsCount} return${s.returnsCount === 1 ? "" : "s"} · ${formatMoney(s.returnsRefund)} back`}
          negativeIsRed
        />
        <ProfitTile
          label="Expenses"
          value={s.expensesTotal.negated()}
          sub={`${s.expensesCount} item${s.expensesCount === 1 ? "" : "s"}`}
          negativeIsRed
        />
      </div>

      {/* Roll-up + cash */}
      <div className="grid gap-x-8 gap-y-2 px-5 py-4 text-sm sm:grid-cols-2">
        <Line label="Gross profit (before expenses)" value={formatMoney(s.grossProfit)} strong />
        <Line
          label="Hard cash in drawer (expected)"
          value={formatMoney(s.cashInHand)}
          strong
          accent="brand"
        />
        <Line label="Cash received on sales today" value={formatMoney(s.cashReceived)} />
        <Line label="Udhaar given today" value={formatMoney(s.creditGiven)} accent="gold" />
        <Line label="Old udhaar recovered today" value={formatMoney(s.creditReceived)} />
        <Line label="Refunds paid today" value={formatMoney(s.returnsRefund)} accent="red" />
        <Line label="Expenses today" value={formatMoney(s.expensesTotal)} accent="red" />
      </div>
    </Card>
  );
}

function ProfitTile({
  label,
  value,
  sub,
  negativeIsRed = false,
}: {
  label: string;
  value: Prisma.Decimal;
  sub: string;
  negativeIsRed?: boolean;
}) {
  const positive = value.gte(0);
  const color =
    negativeIsRed || !positive
      ? "text-red-600 dark:text-red-400"
      : "text-emerald-600 dark:text-emerald-400";
  return (
    <div className="bg-white px-5 py-4 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>
        {positive ? "" : "−"}
        {formatMoney(value.abs())}
      </p>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>
    </div>
  );
}

function Line({
  label,
  value,
  strong = false,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: "brand" | "gold" | "red";
}) {
  const valueColor = accent
    ? {
        brand: "text-brand-700 dark:text-brand-400",
        gold: "text-gold-600 dark:text-gold-400",
        red: "text-red-600 dark:text-red-400",
      }[accent]
    : "text-slate-900 dark:text-slate-100";
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800/60">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : "font-medium"} ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}
