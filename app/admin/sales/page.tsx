import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Badge,
  EmptyState,
  Input,
  Label,
  LinkButton,
  PageHeader,
  Table,
  Td,
  Th,
  btnRowCls,
  btnSecondaryCls,
} from "@/components/ui";
import DeleteWithPassword from "@/components/delete-with-password";
import PeriodProfitCard from "@/components/period-profit-card";
import { deleteSale } from "@/lib/actions/sales";
import { formatDate, formatMoney, pkDateRange } from "@/lib/format";
import { getRangeProfitReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PAID: "emerald",
  PARTIAL: "amber",
  UNPAID: "red",
} as const;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromRaw, to: toRaw } = await searchParams;
  // Either end alone is treated as a single-day filter for that date; both
  // ends together give a range. Both inclusive, in Pakistan-time days.
  const from = fromRaw || toRaw || undefined;
  const to = toRaw || fromRaw || undefined;
  const hasFilter = Boolean(from && to);
  const rangeLabel = hasFilter
    ? from === to
      ? formatDate(from!)
      : `${formatDate(from!)} – ${formatDate(to!)}`
    : undefined;

  const [sales, profit] = await Promise.all([
    prisma.sale.findMany({
      where: {
        deletedAt: null,
        ...(hasFilter ? { createdAt: pkDateRange(from!, to!) } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { name: true } }, customer: { select: { name: true } } },
    }),
    hasFilter ? getRangeProfitReport(from!, to!) : null,
  ]);

  return (
    <div>
      <PageHeader
        title="Sales"
        description={
          hasFilter
            ? `Sales for ${rangeLabel}.`
            : "Latest 100 sales. Each sale has a printable invoice."
        }
        action={<LinkButton href="/admin/sales/new">+ New Sale</LinkButton>}
      />

      <form action="/admin/sales" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="from">Start date</Label>
          <Input id="from" name="from" type="date" defaultValue={fromRaw ?? ""} />
        </div>
        <div>
          <Label htmlFor="to">End date</Label>
          <Input id="to" name="to" type="date" defaultValue={toRaw ?? ""} />
        </div>
        <button type="submit" className={btnSecondaryCls}>
          Filter
        </button>
        {hasFilter && (
          <Link href="/admin/sales" className={btnRowCls}>
            Clear
          </Link>
        )}
      </form>

      {hasFilter && profit && (
        <div className="mb-6">
          <PeriodProfitCard
            title={`Profit for ${rangeLabel}`}
            subtitle="Derived live from sales, wallet, mobile and expense records for this date range"
            summary={profit}
          />
        </div>
      )}

      {sales.length === 0 ? (
        <EmptyState
          title={hasFilter ? "No sales in this range" : "No sales yet"}
          hint={
            hasFilter
              ? "Try another date, or clear the filter to see all sales."
              : "Record your first sale from the fast entry screen."
          }
          action={
            hasFilter ? (
              <Link href="/admin/sales" className={btnSecondaryCls}>
                Clear filter
              </Link>
            ) : (
              <LinkButton href="/admin/sales/new">+ New Sale</LinkButton>
            )
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Product</Th>
              <Th>Customer</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Due</Th>
              <Th>Status</Th>
              <Th className="text-right">Invoice</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <Td className="whitespace-nowrap">{formatDate(s.createdAt)}</Td>
                <Td className="font-medium text-slate-900 dark:text-slate-100">{s.product.name}</Td>
                <Td>{s.customer?.name ?? <span className="text-slate-400">Walk-in</span>}</Td>
                <Td className="text-right tabular-nums">{s.quantity}</Td>
                <Td className="text-right tabular-nums font-medium">{formatMoney(s.totalPrice)}</Td>
                <Td className="text-right tabular-nums">
                  {s.amountDue.gt(0) ? (
                    <span className="text-gold-600 dark:text-gold-400">{formatMoney(s.amountDue)}</span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[s.paymentStatus]}>{s.paymentStatus}</Badge>
                </Td>
                <Td className="text-right">
                  <Link href={`/admin/sales/${s.id}/invoice`} className={btnRowCls}>
                    View
                  </Link>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/sales/${s.id}/edit`} className={btnRowCls}>
                      Edit
                    </Link>
                    <DeleteWithPassword
                      action={deleteSale}
                      hiddenFields={{ id: s.id }}
                      warning={`This reverses stock and cash for ${s.product.name} ×${s.quantity}. Enter your password to confirm.`}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
