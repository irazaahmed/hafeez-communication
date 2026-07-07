import prisma from "@/lib/prisma";
import { currentCashBalance } from "@/lib/ledger";
import { getDailySummary } from "@/lib/reports";
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import DailySummaryCard from "@/components/daily-summary";
import { formatMoney } from "@/lib/format";
import { OpenSessionForm, CloseSessionForm } from "./session-forms";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CashPage() {
  const [balance, openSession, ledger, sessions, summary] = await Promise.all([
    currentCashBalance(prisma),
    prisma.cashSession.findFirst({ where: { closedAt: null } }),
    prisma.cashLedgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.cashSession.findMany({ orderBy: { openedAt: "desc" }, take: 10 }),
    getDailySummary(),
  ]);

  return (
    <div>
      <PageHeader
        title="Cash Sessions"
        description="Live cash balance is the running ledger total. Open a session, then reconcile at close."
      />

      {/* Session control kept at the very top so open/close is always in reach */}
      <Card className="mb-6 p-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Cash in hand (live)
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-brand-700 dark:text-brand-400">
              {formatMoney(balance)}
            </p>
            {openSession ? (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Badge tone="emerald">Session open</Badge>
                since {formatDateTime(openSession.openedAt)} · opened with{" "}
                {formatMoney(openSession.openingAmount)}
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                No session open — start one to begin the day.
              </p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            {openSession ? (
              <>
                <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Close &amp; reconcile</h2>
                <CloseSessionForm />
              </>
            ) : (
              <>
                <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Open a session</h2>
                <OpenSessionForm />
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Today's business */}
      <div className="mb-6">
        <DailySummaryCard summary={summary} />
      </div>

      <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Cash ledger</h2>
            {ledger.length === 0 ? (
              <EmptyState title="No ledger entries yet" hint="Sales, expenses and wallet activity appear here." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Source</Th>
                    <Th>Note</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="text-right">Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e) => (
                    <tr key={e.id}>
                      <Td className="whitespace-nowrap">{formatDateTime(e.createdAt)}</Td>
                      <Td className="text-xs text-slate-500 dark:text-slate-400">
                        {e.sourceType.replaceAll("_", " ").toLowerCase()}
                      </Td>
                      <Td className="text-slate-600 dark:text-slate-300">{e.note ?? "—"}</Td>
                      <Td className="text-right tabular-nums">
                        <span className={e.amount.gte(0) ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          {e.amount.gte(0) ? "+" : "−"}
                          {formatMoney(e.amount.abs())}
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums font-medium">{formatMoney(e.balanceAfter)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {sessions.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Recent sessions</h2>
              <Table>
                <thead>
                  <tr>
                    <Th>Opened</Th>
                    <Th>Closed</Th>
                    <Th className="text-right">Opening</Th>
                    <Th className="text-right">Expected</Th>
                    <Th className="text-right">Counted</Th>
                    <Th className="text-right">Difference</Th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <Td className="whitespace-nowrap">{formatDateTime(s.openedAt)}</Td>
                      <Td className="whitespace-nowrap">
                        {s.closedAt ? formatDateTime(s.closedAt) : <Badge tone="emerald">Open</Badge>}
                      </Td>
                      <Td className="text-right tabular-nums">{formatMoney(s.openingAmount)}</Td>
                      <Td className="text-right tabular-nums">{s.expectedAmount ? formatMoney(s.expectedAmount) : "—"}</Td>
                      <Td className="text-right tabular-nums">{s.closingAmount ? formatMoney(s.closingAmount) : "—"}</Td>
                      <Td className="text-right tabular-nums">
                        {s.difference != null ? (
                          <span className={s.difference.isZero() ? "text-slate-500" : s.difference.gt(0) ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                            {s.difference.gt(0) ? "+" : s.difference.isZero() ? "" : "−"}
                            {formatMoney(s.difference.abs())}
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
      </div>
    </div>
  );
}
