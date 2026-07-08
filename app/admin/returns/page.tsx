import prisma from "@/lib/prisma";
import {
  Badge,
  EmptyState,
  LinkButton,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Returns & refunds"
        description="Items taken back into stock and cash refunds. Each return pays cash out of the drawer."
        action={<LinkButton href="/admin/returns/new">+ New return</LinkButton>}
      />

      {returns.length === 0 ? (
        <EmptyState
          title="No returns yet"
          hint="When a customer brings something back or you refund money, record it here."
          action={<LinkButton href="/admin/returns/new">+ New return</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Type</Th>
              <Th>Item / reason</Th>
              <Th>Customer</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Refund</Th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</Td>
                <Td>
                  <Badge tone={r.type === "ITEM" ? "brand" : "amber"}>
                    {r.type === "ITEM" ? "Item" : "Money"}
                  </Badge>
                </Td>
                <Td className="text-slate-900 dark:text-slate-100">
                  {r.product?.name ?? <span className="text-slate-400">Cash refund</span>}
                  {r.note && (
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{r.note}</span>
                  )}
                </Td>
                <Td>{r.customer?.name ?? <span className="text-slate-400">Walk-in</span>}</Td>
                <Td className="text-right tabular-nums">{r.quantity || "—"}</Td>
                <Td className="text-right tabular-nums font-medium text-red-600 dark:text-red-400">
                  − {formatMoney(r.refundAmount)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
