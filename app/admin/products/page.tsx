import prisma from "@/lib/prisma";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import ProductsTable from "./products-table";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Mobile accessories inventory. Add new stock, or update / restock an existing product."
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/admin/products/update" variant="secondary">
              Update stock
            </LinkButton>
            <LinkButton href="/admin/products/new">+ New stock</LinkButton>
          </div>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Add your first accessory to start tracking stock."
          action={<LinkButton href="/admin/products/new">+ New stock</LinkButton>}
        />
      ) : (
        <ProductsTable
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            variant: p.variant,
            category: p.category,
            costPrice: p.costPrice.toString(),
            salePrice: p.salePrice ? p.salePrice.toString() : null,
            quantity: p.quantity,
          }))}
        />
      )}
    </div>
  );
}
