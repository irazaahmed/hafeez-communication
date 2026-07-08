import prisma from "@/lib/prisma";
import { ReturnType } from "@prisma/client";
import { BackLink, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import ReturnForm, { type SoldItem } from "../return-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New return — Hafeez Communication" };

export default async function NewReturnPage() {
  const [sales, customers] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        createdAt: true,
        product: { select: { name: true } },
        customer: { select: { name: true } },
        returns: { where: { type: ReturnType.ITEM }, select: { quantity: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const soldItems: SoldItem[] = sales
    .map((s) => {
      const returned = s.returns.reduce((sum, r) => sum + r.quantity, 0);
      const remainingQty = s.quantity - returned;
      return {
        saleId: s.id,
        product: s.product.name,
        customer: s.customer?.name ?? null,
        soldQty: s.quantity,
        remainingQty,
        unitPrice: s.unitPrice.toString(),
        totalPrice: s.totalPrice.toString(),
        soldOn: formatDate(s.createdAt),
      };
    })
    .filter((s) => s.remainingQty > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/returns">Back to returns</BackLink>
      <PageHeader
        title="New return"
        description="Take an item back into stock and refund the customer, or record a plain cash refund / change."
      />
      <ReturnForm
        soldItems={soldItems}
        customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
      />
    </div>
  );
}
