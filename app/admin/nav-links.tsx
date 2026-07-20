"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Hand-drawn inline icons (no icon library) keyed by nav item. */
const ICONS: Record<string, React.ReactNode> = {
  dashboard: <path d="M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z" />,
  sale: <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3ZM9 8h6M9 12h6M9 16h4" />,
  stock: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 12l8-4.5M12 12 4 7.5M12 12v9" />,
  credits: <path d="M3 7h18v10H3zM3 11h18M7 15h3" />,
  returns: <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />,
  wallet: <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6H16a2 2 0 0 0 0 4h4M16.5 12v.01" />,
  mobiles: <path d="M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM11 18h2" />,
  customers: <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M14.5 4.15A3.5 3.5 0 0 1 14.5 11" />,
  expenses: <path d="M12 3v18M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  cash: <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 4v10m2.5-7.5A2.5 2.5 0 0 0 12 9c-1.4 0-2.5.7-2.5 2s1.1 2 2.5 2 2.5.7 2.5 2-1.1 2-2.5 2a2.5 2.5 0 0 1-2.5-1.5" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />,
};

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/sales", label: "All Sales", icon: "sale" },
  { href: "/admin/products", label: "Stock", icon: "stock" },
  { href: "/admin/credits", label: "Credits", icon: "credits" },
  { href: "/admin/returns", label: "Returns", icon: "returns" },
  { href: "/admin/wallet", label: "JazzCash / EasyPaisa", icon: "wallet" },
  { href: "/admin/mobiles", label: "Used Mobiles", icon: "mobiles" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/expenses", label: "Expenses", icon: "expenses" },
  { href: "/admin/cash", label: "Cash Sessions", icon: "cash" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 pb-3 md:pb-0">
      {LINKS.map(({ href, label, icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              active
                ? "bg-brand-400/15 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span
              className={`absolute inset-y-1.5 left-0 w-1 rounded-full bg-brand-400 transition-opacity ${
                active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 24 24"
              className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                active ? "text-brand-400" : "text-slate-400 group-hover:text-brand-400"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONS[icon]}
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
