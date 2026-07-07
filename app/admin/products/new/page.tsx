import { BackLink, PageHeader } from "@/components/ui";
import { addProduct } from "@/lib/actions/products";
import ProductForm from "../product-form";

export const metadata = { title: "Add stock — Hafeez Communication" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/products">Back to stock</BackLink>
      <PageHeader title="Add stock" description="Add a new product or restock an existing one." />
      <ProductForm action={addProduct} mode="add" />
    </div>
  );
}
