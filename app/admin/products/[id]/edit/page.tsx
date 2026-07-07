import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader } from "@/components/ui";
import { updateProduct } from "@/lib/actions/products";
import ProductForm from "../../product-form";

export const metadata = { title: "Edit product — Hafeez Communication" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/products">Back to stock</BackLink>
      <PageHeader title="Edit product" description="Update price and specs. Quantity stays unless you enter a new value." />
      <ProductForm
        action={action}
        mode="edit"
        defaults={{
          name: product.name,
          company: product.company,
          variant: product.variant ?? "",
          category: product.category,
          costPrice: product.costPrice.toString(),
          salePrice: product.salePrice.toString(),
          quantity: String(product.quantity),
          imageUrl: product.imageUrl ?? "",
        }}
      />
    </div>
  );
}
