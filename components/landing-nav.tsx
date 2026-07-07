"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { shopWaLink } from "@/lib/whatsapp";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-2.9 4.42c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66 0 .98.72 1.93.82 2.06.1.13 1.4 2.14 3.4 3 .47.2.84.32 1.13.42.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.12-.94-.05-.08-.18-.13-.38-.23-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.51.64-.63.77-.12.13-.23.15-.43.05-.2-.1-.84-.31-1.6-.99-.6-.53-1-1.18-1.12-1.38-.12-.2-.01-.31.09-.41.09-.09.2-.23.3-.35.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.09-.62-1.49-.16-.39-.32-.34-.44-.34l-.38-.01Z" />
    </svg>
  );
}

const SECTIONS = [
  { href: "#categories", label: "Categories" },
  { href: "#services", label: "Services" },
  { href: "#why", label: "Why us" },
  { href: "#visit", label: "Visit" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-navy-700/60 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
            <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={40} height={40} className="h-full w-full object-cover" priority />
          </span>
          <span className="text-sm font-bold leading-tight tracking-tight sm:text-base">
            Hafeez<span className="hidden min-[380px]:inline"> Communication</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
          {SECTIONS.map((s) => (
            <a key={s.href} href={s.href} className="transition-colors hover:text-brand-400">
              {s.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-brand-400/50 hover:text-brand-400"
          >
            <AdminIcon /> Admin
          </Link>
          <a
            href={shopWaLink("Assalam o Alaikum Hafeez Communication!")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-dark"
          >
            <WhatsAppIcon className="h-4 w-4" /> Message us
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-200 transition-colors hover:border-brand-400/50 hover:text-brand-400 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`overflow-hidden border-navy-700/60 transition-[max-height,opacity] duration-200 md:hidden ${
          open ? "max-h-96 border-t opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-brand-400"
            >
              {s.label}
            </a>
          ))}

          <div className="my-2 h-px bg-navy-700/60" />

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-brand-400/50 hover:text-brand-400"
          >
            <AdminIcon /> Admin login
          </Link>
          <a
            href={shopWaLink("Assalam o Alaikum Hafeez Communication!")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-dark"
          >
            <WhatsAppIcon className="h-4 w-4" /> Message us on WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}
