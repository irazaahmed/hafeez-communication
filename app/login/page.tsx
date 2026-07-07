import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | Hafeez Communication",
};

const FEATURES = [
  "Fast single-screen sales with automatic stock updates",
  "Credit (udhaar) tracking with WhatsApp payment reminders",
  "JazzCash / EasyPaisa cash-agent and used-phone ledger",
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative isolate hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(97 177 202 / 0.8) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />

        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-white/25">
            <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={44} height={44} className="h-full w-full object-cover" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Hafeez Communication</span>
        </Link>

        <div className="relative z-10 max-w-md animate-fade-in-up">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            The whole shop, in one panel.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Stock, sales, udhaar, JazzCash/EasyPaisa and used phones — every
            rupee tracked through one live cash ledger.
          </p>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400/20 text-brand-400 ring-1 ring-brand-400/30">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">Admin access only.</p>
      </div>

      {/* Right — login form */}
      <div className="relative flex flex-col items-center justify-center bg-white px-4 py-12 dark:bg-slate-950 sm:px-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <Link href="/" className="mb-8 inline-flex items-center gap-3 lg:hidden">
          <span className="flex h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
            <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={44} height={44} className="h-full w-full object-cover" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Hafeez Communication</span>
        </Link>

        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to the admin panel</p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              Back to website
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
