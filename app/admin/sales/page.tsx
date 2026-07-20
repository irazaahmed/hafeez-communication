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
import { deleteSale } from "@/lib/actions/sales";
import { formatDate, formatMoney, pkDayRange } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PAID: "emerald",
  PARTIAL: "amber",
  UNPAID: "red",
} as const;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      ...(date ? { createdAt: pkDayRange(date) } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true } }, customer: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Sales"
        description={
          date
            ? `Sales on ${formatDate(date)}.`
            : "Latest 100 sales. Each sale has a printable invoice."
        }
        action={<LinkButton href="/admin/sales/new">+ New Sale</LinkButton>}
      />

      <form action="/admin/sales" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="date">Filter by date</Label>
          <Input id="date" name="date" type="date" defaultValue={date ?? ""} />
        </div>
        <button type="submit" className={btnSecondaryCls}>
          Filter
        </button>
        {date && (
          <Link href="/admin/sales" className={btnRowCls}>
            Clear
          </Link>
        )}
      </form>

      {sales.length === 0 ? (
        <EmptyState
          title={date ? "No sales on this date" : "No sales yet"}
          hint={
            date
              ? "Try another date, or clear the filter to see all sales."
              : "Record your first sale from the fast entry screen."
          }
          action={
            date ? (
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
