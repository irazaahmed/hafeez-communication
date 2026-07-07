import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import ExpenseForm from "./expense-form";

export const dynamic = "force-dynamic";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function ExpensesPage() {
  const [expenses, monthAgg] = await Promise.all([
    prisma.expense.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.expense.aggregate({
      where: { createdAt: { gte: startOfMonth(new Date()) } },
      _sum: { amount: true },
    }),
  ]);

  const monthTotal = monthAgg._sum.amount ?? new Prisma.Decimal(0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Shop expenses. Each one reduces the cash balance."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Add expense</h2>
          <ExpenseForm />
        </Card>

        <div>
          <Card className="mb-4 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              This month
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {formatMoney(monthTotal)}
            </p>
          </Card>

          {expenses.length === 0 ? (
            <EmptyState title="No expenses yet" hint="Record a shop expense to see it here." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Note</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap">{formatDate(e.createdAt)}</Td>
                    <Td className="font-medium text-slate-900 dark:text-slate-100">{e.category}</Td>
                    <Td className="text-slate-500 dark:text-slate-400">{e.note ?? "—"}</Td>
                    <Td className="text-right tabular-nums text-red-600 dark:text-red-400">
                      −{formatMoney(e.amount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
