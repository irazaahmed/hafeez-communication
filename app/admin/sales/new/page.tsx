import prisma from "@/lib/prisma";
import { BackLink, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import SaleForm from "../sale-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New sale — Hafeez Communication" };

export default async function NewSalePage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ name: "asc" }] }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/sales">Back to sales</BackLink>
      <PageHeader title="New sale" description="Fast single-item entry. Stock updates automatically." />

      {products.length === 0 ? (
        <EmptyState
          title="No products in stock"
          hint="Add stock before recording a sale."
          action={<LinkButton href="/admin/products/new">+ Add stock</LinkButton>}
        />
      ) : (
        <SaleForm
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            variant: p.variant,
            quantity: p.quantity,
            salePrice: p.salePrice ? p.salePrice.toString() : null,
          }))}
          customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
        />
      )}
    </div>
  );
}
