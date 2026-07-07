import { BackLink, PageHeader } from "@/components/ui";
import { addProduct } from "@/lib/actions/products";
import ProductForm from "../product-form";

export const metadata = { title: "New stock — Hafeez Communication" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/products">Back to stock</BackLink>
      <PageHeader
        title="New stock"
        description="Add a brand-new product. If it already exists, you'll be asked to confirm a restock instead."
      />
      <ProductForm action={addProduct} mode="add" />
    </div>
  );
}
