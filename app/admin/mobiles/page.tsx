import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  btnRowCls,
} from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import MobileBuyForm from "./mobile-buy-form";

export const dynamic = "force-dynamic";

export default async function MobilesPage() {
  const mobiles = await prisma.mobile.findMany({
    orderBy: [{ status: "asc" }, { purchasedAt: "desc" }],
    include: { soldTo: { select: { name: true } } },
  });

  const inStock = mobiles.filter((m) => m.status === "IN_STOCK");

  return (
    <div>
      <PageHeader
        title="Used Mobiles"
        description="Independent buy/sell of used phones — separate from accessories stock."
      />

      <div className="space-y-6">
        <Card className="max-w-3xl p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Buy a used mobile</h2>
          <MobileBuyForm />
        </Card>

        <div>
          {mobiles.length === 0 ? (
            <EmptyState title="No mobiles yet" hint="Buy a used phone to start tracking." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Model</Th>
                  <Th>IMEI</Th>
                  <Th className="text-right">Purchase</Th>
                  <Th className="text-right">Sale</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {mobiles.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{m.model}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        from {m.purchasedFrom} · {formatDate(m.purchasedAt)}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-500 dark:text-slate-400">{m.imei ?? "—"}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(m.purchasePrice)}</Td>
                    <Td className="text-right tabular-nums font-medium">
                      {m.salePrice ? formatMoney(m.salePrice) : "—"}
                    </Td>
                    <Td>
                      {m.status === "IN_STOCK" ? (
                        <Badge tone="brand">In stock</Badge>
                      ) : (
                        <Badge tone="slate">
                          Sold{m.soldTo ? ` · ${m.soldTo.name}` : ""}
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      {m.status === "IN_STOCK" ? (
                        <Link href={`/admin/mobiles/${m.id}/sell`} className={btnRowCls}>
                          Sell
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">{m.soldAt ? formatDate(m.soldAt) : ""}</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {inStock.length > 0 && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {inStock.length} phone{inStock.length === 1 ? "" : "s"} in stock.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
