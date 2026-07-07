import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Badge,
  EmptyState,
  LinkButton,
  PageHeader,
  Table,
  Td,
  Th,
  btnRowCls,
} from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import { formatMoney } from "@/lib/format";
import { deleteProduct } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

const LOW_STOCK = 5;

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Mobile accessories inventory. Adding an existing product restocks it."
        action={<LinkButton href="/admin/products/new">+ Add stock</LinkButton>}
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Add your first accessory to start tracking stock."
          action={<LinkButton href="/admin/products/new">+ Add stock</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th className="text-right">Cost</Th>
              <Th className="text-right">Sale</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <Td>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{p.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {p.company}
                    {p.variant ? ` · ${p.variant}` : ""}
                  </span>
                </Td>
                <Td>{p.category}</Td>
                <Td className="text-right tabular-nums">{formatMoney(p.costPrice)}</Td>
                <Td className="text-right tabular-nums font-medium">{formatMoney(p.salePrice)}</Td>
                <Td className="text-right">
                  {p.quantity <= LOW_STOCK ? (
                    <Badge tone={p.quantity === 0 ? "red" : "amber"}>{p.quantity}</Badge>
                  ) : (
                    <span className="tabular-nums">{p.quantity}</span>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link href={`/admin/products/${p.id}/edit`} className={btnRowCls}>
                      Edit
                    </Link>
                    <DeleteButton action={deleteProduct.bind(null, p.id)} />
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
