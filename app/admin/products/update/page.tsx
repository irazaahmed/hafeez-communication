import prisma from "@/lib/prisma";
import { BackLink, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import UpdateStockPicker from "./update-picker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Update stock — Hafeez Communication" };

export default async function UpdateStockPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/products">Back to stock</BackLink>
      <PageHeader
        title="Update stock"
        description="Pick an existing product to restock it or edit its price / specs."
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products to update yet"
          hint="Add your first product, then come back here to restock or edit it."
          action={<LinkButton href="/admin/products/new">+ New stock</LinkButton>}
        />
      ) : (
        <UpdateStockPicker
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            variant: p.variant,
            category: p.category,
            quantity: p.quantity,
            salePrice: p.salePrice ? p.salePrice.toString() : null,
          }))}
        />
      )}
    </div>
  );
}
