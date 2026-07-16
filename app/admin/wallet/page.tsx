import prisma from "@/lib/prisma";
import { Card, EmptyState, PageHeader, Table, Td, Th, Badge } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import WalletForm from "./wallet-form";
import DeleteWalletTxn from "./delete-wallet-txn";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const [customers, txns] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.walletTransaction.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="JazzCash / EasyPaisa"
        description="Cash-agent transactions. The cash effect is recomputed on the server."
      />

      <div className="space-y-6">
        <Card className="max-w-3xl p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">New transaction</h2>
          <WalletForm customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))} />
        </Card>

        <div>
          {txns.length === 0 ? (
            <EmptyState title="No transactions yet" hint="Record a deposit, transfer or withdrawal to get started." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Provider</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Charges</Th>
                  <Th className="text-right">Cash effect</Th>
                  <Th>Customer</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id}>
                    <Td className="whitespace-nowrap">{formatDate(t.createdAt)}</Td>
                    <Td>
                      <Badge tone={t.provider === "JAZZCASH" ? "red" : "emerald"}>{t.provider}</Badge>
                    </Td>
                    <Td>{t.type}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(t.amount)}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(t.charges)}</Td>
                    <Td className="text-right tabular-nums font-medium">
                      <span className={t.cashEffect.gte(0) ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {t.cashEffect.gte(0) ? "+" : "−"}
                        {formatMoney(t.cashEffect.abs())}
                      </span>
                    </Td>
                    <Td>{t.customer?.name ?? <span className="text-slate-400">—</span>}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end">
                        <DeleteWalletTxn id={t.id} label={`${t.provider} ${t.type} of ${formatMoney(t.amount)}`} />
                      </div>
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
