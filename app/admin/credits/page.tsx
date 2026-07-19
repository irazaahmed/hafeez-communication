import Link from "next/link";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import RecordPaymentForm from "@/components/record-payment-form";
import { formatDate, formatMoney } from "@/lib/format";
import { recordCreditPayment } from "@/lib/actions/sales";
import { waLink, reminderMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const credits = await prisma.sale.findMany({
    where: { amountDue: { gt: 0 }, deletedAt: null },
    orderBy: { createdAt: "asc" }, // oldest due first
    include: { customer: true, product: { select: { name: true } } },
  });

  const total = credits.reduce((s, c) => s.add(c.amountDue), new Prisma.Decimal(0));

  return (
    <div>
      <PageHeader
        title="Pending Credits"
        description="Unpaid & partial sales, oldest first. Record payments or send a WhatsApp reminder."
        action={
          credits.length > 0 ? (
            <Badge tone="amber">{formatMoney(total)} outstanding</Badge>
          ) : undefined
        }
      />

      {credits.length === 0 ? (
        <EmptyState title="No pending credit" hint="Every credit sale is fully paid. 🎉" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {credits.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {c.customer?.name ?? "Walk-in (no contact)"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {c.product.name} · {c.quantity} pcs · sold {formatDate(c.createdAt)}
                  </p>
                  {c.customer?.phone && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.customer.phone}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold tabular-nums text-gold-600 dark:text-gold-400">
                    {formatMoney(c.amountDue)}
                  </p>
                  <p className="text-xs text-slate-400">of {formatMoney(c.totalPrice)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="min-w-[12rem] flex-1">
                  <RecordPaymentForm
                    action={recordCreditPayment.bind(null, c.id)}
                    remainingLabel={formatMoney(c.amountDue)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {c.customer?.phone ? (
                    <a
                      href={waLink(c.customer.phone, reminderMessage(c.customer.name, c.amountDue.toString()))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-whatsapp-dark"
                    >
                      Remind on WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No phone on file</span>
                  )}
                  <Link
                    href={`/admin/sales/${c.id}/invoice`}
                    className="text-center text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    View invoice
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
