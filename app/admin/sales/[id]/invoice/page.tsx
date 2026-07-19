import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, Badge } from "@/components/ui";
import { InvoicePrintButton } from "@/components/invoice-print-button";
import { formatDate, formatMoney } from "@/lib/format";
import { SHOP_WHATSAPP } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice — Hafeez Communication" };

const STATUS_TONE = { PAID: "emerald", PARTIAL: "amber", UNPAID: "red" } as const;

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { product: true, customer: true },
  });
  if (!sale) notFound();

  const invoiceNo = `HC-${sale.id.slice(-8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <BackLink href="/admin/sales">Back to sales</BackLink>
        <InvoicePrintButton />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:border-0 print:p-0 print:shadow-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 print:dark:bg-white print:dark:text-black">
        {/* Letterhead */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 overflow-hidden rounded-xl ring-1 ring-slate-200">
              <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={56} height={56} className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">Hafeez Communication</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mobile accessories · used phones · easy load</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">WhatsApp: {SHOP_WHATSAPP}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Invoice</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{invoiceNo}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(sale.createdAt)}</p>
            {sale.deletedAt && (
              <p className="mt-1">
                <Badge tone="red">Deleted</Badge>
              </p>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div className="flex flex-wrap justify-between gap-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed to</p>
            {sale.customer ? (
              <>
                <p className="mt-1 font-medium">{sale.customer.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{sale.customer.phone}</p>
              </>
            ) : (
              <p className="mt-1 text-slate-500 dark:text-slate-400">Walk-in customer</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <span className="text-sm">{sale.paymentType}</span>
              <Badge tone={STATUS_TONE[sale.paymentStatus]}>{sale.paymentStatus}</Badge>
            </div>
          </div>
        </div>

        {/* Line item */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-3">
                <span className="font-medium">{sale.product.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {sale.product.company}
                  {sale.product.variant ? ` · ${sale.product.variant}` : ""}
                </span>
              </td>
              <td className="py-3 text-right tabular-nums">{sale.quantity}</td>
              <td className="py-3 text-right tabular-nums">{formatMoney(sale.unitPrice)}</td>
              <td className="py-3 text-right tabular-nums">{formatMoney(sale.totalPrice)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total</span>
            <span className="font-semibold tabular-nums">{formatMoney(sale.totalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Paid</span>
            <span className="tabular-nums">{formatMoney(sale.amountPaid)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 dark:border-slate-700">
            <span className="font-semibold">Balance due</span>
            <span className="font-bold tabular-nums text-gold-600 dark:text-gold-400">{formatMoney(sale.amountDue)}</span>
          </div>
        </div>

        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-700">
          Shukriya! Message us on WhatsApp {SHOP_WHATSAPP} for any query.
        </p>
      </div>
    </div>
  );
}
