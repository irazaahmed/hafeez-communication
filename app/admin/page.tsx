import Link from "next/link";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { currentCashBalance } from "@/lib/ledger";
import { getDailySummary } from "@/lib/reports";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import DailySummaryCard from "@/components/daily-summary";
import { formatDate, formatMoney } from "@/lib/format";
import { waLink, reminderMessage } from "@/lib/whatsapp";

// Cash balance, credits, and session status must always be current.
export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function AdminDashboardPage() {
  const todayStart = startOfDay(new Date());
  const zero = new Prisma.Decimal(0);

  const [
    cashBalance,
    openSession,
    todaySales,
    pendingCredits,
    productCount,
    lowStockCount,
    customerCount,
    mobilesInStock,
    recentLedger,
    summary,
  ] = await Promise.all([
    currentCashBalance(prisma),
    prisma.cashSession.findFirst({ where: { closedAt: null } }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { totalPrice: true, amountPaid: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { amountDue: { gt: 0 } },
      orderBy: { createdAt: "asc" }, // oldest due first
      include: { customer: true, product: { select: { name: true } } },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { quantity: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.customer.count(),
    prisma.mobile.count({ where: { status: "IN_STOCK" } }),
    prisma.cashLedgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getDailySummary(),
  ]);

  const pendingTotal = pendingCredits.reduce((s, sale) => s.add(sale.amountDue), zero);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live cash position, pending credits and today's activity."
        action={<LinkButton href="/admin/sales/new">+ New Sale</LinkButton>}
      />

      {/* Top stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cash in hand (live)"
          value={formatMoney(cashBalance)}
          note="running ledger balance"
          accent="brand"
        />
        <StatCard
          label="Today's sales"
          value={formatMoney(todaySales._sum.totalPrice ?? zero)}
          note={`${todaySales._count} sale${todaySales._count === 1 ? "" : "s"} · ${formatMoney(todaySales._sum.amountPaid ?? zero)} received`}
        />
        <StatCard
          label="Pending credit"
          value={formatMoney(pendingTotal)}
          note={`${pendingCredits.length} unpaid sale${pendingCredits.length === 1 ? "" : "s"}`}
          accent={pendingTotal.gt(0) ? "gold" : "slate"}
        />
        <StatCard
          label="Cash session"
          value={openSession ? "Open" : "Closed"}
          note={
            openSession
              ? `opened ${formatDate(openSession.openedAt)}`
              : "no session running"
          }
          accent={openSession ? "emerald" : "slate"}
        />
      </div>

      {/* Secondary counts */}
      <Card className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3">
        <MiniStat label="Products" value={productCount} href="/admin/products" />
        <MiniStat label="Low stock" value={lowStockCount} href="/admin/products" tone={lowStockCount > 0 ? "red" : undefined} />
        <MiniStat label="Customers" value={customerCount} href="/admin/customers" />
        <MiniStat label="Mobiles in stock" value={mobilesInStock} href="/admin/mobiles" />
      </Card>

      {/* Today's business — profit breakdown + expected cash (evening hisab) */}
      <div className="mt-6">
        <DailySummaryCard summary={summary} />
      </div>

      {/* Today's sales — what sold and for how much */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Today&apos;s sales</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Each sale with its profit</p>
        </div>
        {summary.sales.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No sales recorded today yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {summary.sales.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {s.product} <span className="text-slate-400">×{s.quantity}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {s.paymentType === "CREDIT" ? "Udhaar" : "Cash"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatMoney(s.totalPrice)}
                  </p>
                  <p className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(s.profit)} profit
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        {/* Pending credits with WhatsApp reminders */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Pending Credits</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Oldest due first · remind on WhatsApp</p>
            </div>
            {pendingCredits.length > 0 && <Badge tone="amber">{formatMoney(pendingTotal)}</Badge>}
          </div>

          {pendingCredits.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No pending credit — everyone's paid up. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingCredits.slice(0, 8).map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {sale.customer?.name ?? "Walk-in (no contact)"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {sale.product.name} · due since {formatDate(sale.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-gold-600 dark:text-gold-400">
                      {formatMoney(sale.amountDue)}
                    </span>
                    {sale.customer?.phone ? (
                      <a
                        href={waLink(
                          sale.customer.phone,
                          reminderMessage(sale.customer.name, sale.amountDue.toString()),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-whatsapp px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-whatsapp-dark"
                      >
                        Remind
                      </a>
                    ) : (
                      <Link href="/admin/credits" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                        Record
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {pendingCredits.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
              <Link href="/admin/credits" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                Manage all credits →
              </Link>
            </div>
          )}
        </Card>

        {/* Recent cash activity */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent cash activity</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Latest ledger entries</p>
          </div>
          {recentLedger.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No cash activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLedger.map((e) => {
                const positive = e.amount.gte(0);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                        {e.note ?? e.sourceType}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {e.sourceType.replaceAll("_", " ").toLowerCase()} · {formatDate(e.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {positive ? "+" : "−"}
                      {formatMoney(e.amount.abs())}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Link href="/admin/cash" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              Full ledger & sessions →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------- components ------------------------------ */

function StatCard({
  label,
  value,
  note,
  accent = "slate",
}: {
  label: string;
  value: string;
  note: string;
  accent?: "slate" | "brand" | "gold" | "emerald";
}) {
  const valueColor = {
    slate: "text-slate-900 dark:text-slate-100",
    brand: "text-brand-700 dark:text-brand-400",
    gold: "text-gold-600 dark:text-gold-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  }[accent];
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1.5 whitespace-nowrap text-xl font-bold tabular-nums xl:text-2xl ${valueColor}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone?: "red";
}) {
  return (
    <Link
      href={href}
      className="group flex items-baseline gap-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <span
        className={`text-lg font-bold tabular-nums ${
          tone === "red" ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </span>
      <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-brand-700 group-hover:underline dark:text-slate-400 dark:group-hover:text-brand-400">
        {label}
      </span>
    </Link>
  );
}
