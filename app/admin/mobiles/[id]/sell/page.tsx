import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { BackLink, Card, PageHeader } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import MobileSellForm from "./sell-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sell mobile — Hafeez Communication" };

export default async function SellMobilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [mobile, customers] = await Promise.all([
    prisma.mobile.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!mobile) notFound();
  if (mobile.status === "SOLD") redirect("/admin/mobiles");

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/mobiles">Back to mobiles</BackLink>
      <PageHeader title={`Sell ${mobile.model}`} />
      <Card className="p-5">
        <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-300">
            {mobile.model}
            {mobile.imei ? ` · IMEI ${mobile.imei}` : ""}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bought from {mobile.purchasedFrom} for {formatMoney(mobile.purchasePrice)}
          </p>
        </div>
        <MobileSellForm
          mobileId={mobile.id}
          customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
        />
      </Card>
    </div>
  );
}
