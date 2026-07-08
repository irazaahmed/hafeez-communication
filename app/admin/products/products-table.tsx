"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Input, Table, Td, Th, btnRowCls } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import { formatMoney } from "@/lib/format";
import { deleteProduct } from "@/lib/actions/products";

export type StockRow = {
  id: string;
  name: string;
  company: string;
  variant: string | null;
  category: string;
  costPrice: string;
  salePrice: string | null;
  quantity: number;
};

const LOW_STOCK = 5;
const ALL = "__all__";

/**
 * Stock table with a category filter (see how many of each type there are —
 * e.g. "Handsfree") plus a free-text search. Client-side so filtering is instant.
 */
export default function ProductsTable({ products }: { products: StockRow[] }) {
  const [category, setCategory] = useState<string>(ALL);
  const [q, setQ] = useState("");

  // Categories with their counts, sorted by name.
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== ALL && p.category !== category) return false;
      if (!term) return true;
      return `${p.name} ${p.company} ${p.variant ?? ""} ${p.category}`
        .toLowerCase()
        .includes(term);
    });
  }, [products, category, q]);

  const totalUnits = filtered.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <Chip active={category === ALL} onClick={() => setCategory(ALL)}>
          All <span className="tabular-nums opacity-70">({products.length})</span>
        </Chip>
        {categories.map(([cat, count]) => (
          <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
            {cat} <span className="tabular-nums opacity-70">({count})</span>
          </Chip>
        ))}
      </div>

      <Input
        type="search"
        placeholder="Search stock by name, company or variant…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search stock"
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{filtered.length}</span>{" "}
        product{filtered.length === 1 ? "" : "s"}
        {category !== ALL && ` in ${category}`} ·{" "}
        <span className="font-medium text-slate-700 dark:text-slate-300">{totalUnits}</span> total units
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No products match this filter.
        </p>
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
            {filtered.map((p) => (
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
                <Td className="text-right tabular-nums font-medium">
                  {p.salePrice ? formatMoney(p.salePrice) : <span className="text-slate-400">—</span>}
                </Td>
                <Td className="text-right">
                  {p.quantity <= LOW_STOCK ? (
                    <Badge tone={p.quantity === 0 ? "red" : "amber"}>{p.quantity}</Badge>
                  ) : (
                    <span className="tabular-nums">{p.quantity}</span>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link href={`/admin/products/${p.id}/restock`} className={btnRowCls}>
                      Restock
                    </Link>
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-400"
          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
