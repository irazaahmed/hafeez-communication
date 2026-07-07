"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Input } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export type UpdateProduct = {
  id: string;
  name: string;
  company: string;
  variant: string | null;
  category: string;
  quantity: number;
  salePrice: string | null;
};

/**
 * Searchable list of existing products for the "Update stock" flow. Pick one to
 * open its edit page (restock, change price/specs).
 */
export default function UpdateStockPicker({ products }: { products: UpdateProduct[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      `${p.name} ${p.company} ${p.variant ?? ""} ${p.category}`
        .toLowerCase()
        .includes(term),
    );
  }, [products, q]);

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search by name, company, variant or category…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search products"
      />

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No products match “{q}”.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {p.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {p.company}
                      {p.variant ? ` · ${p.variant}` : ""} · {p.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <span className="block font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {p.quantity} pcs
                      </span>
                      {p.salePrice ? formatMoney(p.salePrice) : "no fixed price"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
                      Update
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
