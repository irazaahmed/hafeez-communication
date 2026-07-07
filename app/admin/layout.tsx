import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";
import NavLinks from "./nav-links";

export const metadata: Metadata = {
  title: "Admin — Hafeez Communication",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email ?? "";

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex-row">
      {/* Sidebar (stacks on top on small screens) */}
      <aside className="w-full shrink-0 border-b border-navy-700/50 bg-navy-900 md:w-64 md:border-b-0 md:border-r print:hidden">
        <div className="flex flex-col md:sticky md:top-0 md:h-screen">
          <div className="flex items-center gap-3 px-5 py-4 md:py-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/15">
              <Image
                src="/HC-Logo.jpeg"
                alt="Hafeez Communication"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </span>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight text-white">
                Hafeez Communication
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-brand-400">
                Admin Panel
              </p>
            </div>
          </div>
          <NavLinks />
          <div className="mt-auto hidden px-5 py-4 md:block">
            <p className="text-[11px] text-slate-500">
              Mobile accessories · used phones · cash agent
            </p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 print:hidden">
          <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
            Signed in as{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">{email}</span>
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold uppercase text-brand-700 ring-1 ring-inset ring-brand-200 sm:hidden dark:bg-brand-400/10 dark:text-brand-400 dark:ring-brand-400/20"
            title={email}
          >
            {email.charAt(0) || "A"}
          </span>
          <ThemeToggle />
          <SignOutButton />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
