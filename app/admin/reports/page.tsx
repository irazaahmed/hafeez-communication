import Link from "next/link";
import { getMonthlyProfitReport, getMonthlyProfitHistory } from "@/lib/reports";
import {
  Card,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Table,
  Td,
  Th,
  btnRowCls,
  btnSecondaryCls,
} from "@/components/ui";
import MonthlyProfitCard from "@/components/monthly-profit-card";
import { currentMonthInputValue, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfitReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: requested } = await searchParams;
  const currentMonth = currentMonthInputValue();
  const month = requested || currentMonth;

  const [report, history] = await Promise.all([
    getMonthlyProfitReport(month),
    getMonthlyProfitHistory(12),
  ]);

  return (
    <div>
      <PageHeader
        title="Profit Report"
        description="Monthly profit, derived live from sales, wallet, mobile and expense records — nothing is stored separately."
      />

      <form action="/admin/reports" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="month">Filter by month</Label>
          <Input id="month" name="month" type="month" defaultValue={month} max={currentMonth} />
        </div>
        <button type="submit" className={btnSecondaryCls}>
          Filter
        </button>
        {month !== currentMonth && (
          <Link href="/admin/reports" className={btnRowCls}>
            This month
          </Link>
        )}
      </form>

      <div className="space-y-6">
        <MonthlyProfitCard summary={report} />

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sales in {report.label}
          </h2>
          {report.sales.length === 0 ? (
            <EmptyState
              title="No sales this month"
              hint="Sales recorded in this month will show up here with their profit."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th className="text-right">Qty</Th>
                  <Th>Payment</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Profit</Th>
                </tr>
              </thead>
              <tbody>
                {report.sales.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-medium text-slate-900 dark:text-slate-100">{s.product}</Td>
                    <Td className="text-right tabular-nums">{s.quantity}</Td>
                    <Td>{s.paymentType === "CREDIT" ? "Udhaar" : "Cash"}</Td>
                    <Td className="text-right tabular-nums font-medium">{formatMoney(s.totalPrice)}</Td>
                    <Td className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(s.profit)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Last 12 months
          </h2>
          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Month</Th>
                  <Th className="text-right">Sales revenue</Th>
                  <Th className="text-right">Gross profit</Th>
                  <Th className="text-right">Expenses</Th>
                  <Th className="text-right">Net profit</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.month}>
                    <Td>
                      <Link
                        href={`/admin/reports?month=${h.month}`}
                        className={`font-medium hover:underline ${
                          h.month === month
                            ? "text-brand-700 dark:text-brand-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {h.label}
                      </Link>
                    </Td>
                    <Td className="text-right tabular-nums">{formatMoney(h.salesRevenue)}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(h.grossProfit)}</Td>
                    <Td className="text-right tabular-nums text-red-600 dark:text-red-400">
                      {formatMoney(h.expensesTotal)}
                    </Td>
                    <Td className="text-right tabular-nums font-semibold">
                      <span
                        className={
                          h.netProfit.gte(0)
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {formatMoney(h.netProfit)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
