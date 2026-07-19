import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import EditSaleForm from "./edit-sale-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit sale — Hafeez Communication" };

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sale, customers] = await Promise.all([
    prisma.sale.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, company: true, variant: true, quantity: true } },
        _count: { select: { payments: true, returns: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!sale || sale.deletedAt) notFound();

  const locked = sale._count.payments > 0 || sale._count.returns > 0;
  const lockedReason =
    sale._count.returns > 0
      ? "a return recorded against it"
      : "credit payments already recorded against it";

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/sales">Back to sales</BackLink>
      <PageHeader
        title="Edit sale"
        description={`${sale.product.name} · sold ${formatDate(sale.createdAt)}`}
      />

      {locked ? (
        <Card className="p-5 text-sm text-slate-600 dark:text-slate-300">
          <p>
            This sale can&apos;t be edited because it already has {lockedReason}. Editing quantity,
            price or payment now would desync stock, cash and profit from what already happened.
          </p>
          <p className="mt-2">
            {sale._count.returns > 0
              ? "Reverse the return first if you need to change this sale."
              : "Use the credit payment screen for further payments, or delete this sale from the sales list if it was entered by mistake."}
          </p>
        </Card>
      ) : (
        <Card className="p-5">
          <EditSaleForm
            sale={{
              id: sale.id,
              quantity: sale.quantity,
              unitPrice: sale.unitPrice.toString(),
              paymentType: sale.paymentType,
              amountPaid: sale.amountPaid.toString(),
              customerId: sale.customerId,
            }}
            product={{
              label: `${sale.product.name} · ${sale.product.company}${sale.product.variant ? ` · ${sale.product.variant}` : ""}`,
              // Stock currently free for this product PLUS what this sale already
              // holds — the maximum this sale's quantity could be corrected to.
              maxQuantity: sale.product.quantity + sale.quantity,
            }}
            customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
          />
        </Card>
      )}
    </div>
  );
}
