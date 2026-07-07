import Link from "next/link";
import { Prisma } from "@prisma/client";
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
import { deleteCustomer } from "@/lib/actions/customers";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, dueByCustomer] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { amountDue: { gt: 0 }, customerId: { not: null } },
      _sum: { amountDue: true },
    }),
  ]);

  const dueMap = new Map<string, Prisma.Decimal>();
  for (const row of dueByCustomer) {
    if (row.customerId) dueMap.set(row.customerId, row._sum.amountDue ?? new Prisma.Decimal(0));
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Phone is the unique key — the sale form reuses these records."
        action={<LinkButton href="/admin/customers/new">+ Add customer</LinkButton>}
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          hint="Add a customer, or they'll be created automatically from the sale form."
          action={<LinkButton href="/admin/customers/new">+ Add customer</LinkButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th className="text-right">Outstanding</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const due = dueMap.get(c.id);
              return (
                <tr key={c.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{c.name}</Td>
                  <Td>
                    <a
                      href={waLink(c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {c.phone}
                    </a>
                  </Td>
                  <Td className="text-right">
                    {due && due.gt(0) ? (
                      <Badge tone="amber">{formatMoney(due)}</Badge>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/admin/customers/${c.id}/edit`} className={btnRowCls}>
                        Edit
                      </Link>
                      <DeleteButton action={deleteCustomer.bind(null, c.id)} />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
