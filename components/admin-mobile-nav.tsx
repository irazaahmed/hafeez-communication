"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import NavLinks from "@/app/admin/nav-links";

/**
 * Mobile-only top bar for the admin panel: brand + hamburger that opens a
 * slide-over drawer holding the same NavLinks used by the desktop sidebar.
 * Hidden on md+ where the persistent sidebar takes over.
 */
export default function AdminMobileNav({
  email,
  signOut,
}: {
  email: string;
  signOut: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the drawer is open, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Trigger row (lives inside the sticky header) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10">
            <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={32} height={32} className="h-full w-full object-cover" />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Hafeez</span>
        </span>
      </div>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col bg-navy-900 shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
              <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={40} height={40} className="h-full w-full object-cover" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-white">Hafeez Communication</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-brand-400">Admin Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>

        <div className="border-t border-navy-700/60 px-5 py-4">
          {email && (
            <p className="mb-3 truncate text-xs text-slate-400">
              Signed in as <span className="font-medium text-slate-200">{email}</span>
            </p>
          )}
          {signOut}
        </div>
      </aside>
    </div>
  );
}
