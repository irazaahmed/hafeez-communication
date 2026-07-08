import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader } from "@/components/ui";
import { restockProduct } from "@/lib/actions/products";
import RestockForm from "./restock-form";

export const metadata = { title: "Restock — Hafeez Communication" };

export default async function RestockProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const action = restockProduct.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/products/update">Back to update stock</BackLink>
      <PageHeader
        title={`Restock — ${product.name}`}
        description={`${product.company}${product.variant ? ` · ${product.variant}` : ""} · ${product.category}. Add more units to what's already in stock.`}
      />

      <RestockForm
        action={action}
        currentQty={product.quantity}
        costPrice={product.costPrice.toString()}
        salePrice={product.salePrice ? product.salePrice.toString() : null}
      />

      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Only need to fix the name / category / specs (not the quantity)?{" "}
        <Link
          href={`/admin/products/${id}/edit`}
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Edit product details
        </Link>
        .
      </p>
    </div>
  );
}
