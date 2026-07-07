import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, PageHeader } from "@/components/ui";
import { updateCustomer } from "@/lib/actions/customers";
import CustomerForm from "../../customer-form";

export const metadata = { title: "Edit customer — Hafeez Communication" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/customers">Back to customers</BackLink>
      <PageHeader title="Edit customer" />
      <CustomerForm
        action={updateCustomer.bind(null, id)}
        defaults={{ name: customer.name, phone: customer.phone }}
        submitLabel="Save changes"
      />
    </div>
  );
}
