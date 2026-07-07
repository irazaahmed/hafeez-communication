import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { shopWaLink, SHOP_WHATSAPP } from "@/lib/whatsapp";

/* Inline WhatsApp glyph so the CTA reads unmistakably as WhatsApp. */
function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-2.9 4.42c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66 0 .98.72 1.93.82 2.06.1.13 1.4 2.14 3.4 3 .47.2.84.32 1.13.42.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.12-.94-.05-.08-.18-.13-.38-.23-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.51.64-.63.77-.12.13-.23.15-.43.05-.2-.1-.84-.31-1.6-.99-.6-.53-1-1.18-1.12-1.38-.12-.2-.01-.31.09-.41.09-.09.2-.23.3-.35.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.09-.62-1.49-.16-.39-.32-.34-.44-.34l-.38-.01Z" />
    </svg>
  );
}

const SERVICES = [
  {
    title: "Mobile Accessories",
    body: "Chargers, cables, hands-free, covers, glass protectors, power banks and more — all leading brands at fair prices.",
    prompt: "Assalam o Alaikum, mujhe mobile accessories chahiye.",
    icon: (
      <path d="M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm4 17h4" />
    ),
  },
  {
    title: "Used Phones — Buy & Sell",
    body: "Quality-checked second-hand handsets with clear pricing. Selling your old phone? Bring it in for a fair offer.",
    prompt: "Assalam o Alaikum, mujhe used phone ke baare mein poochna hai.",
    icon: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 12v9M12 12 4 7.5M12 12l8-4.5" />,
  },
  {
    title: "JazzCash / EasyPaisa",
    body: "Easy load, deposits, withdrawals and money transfer. Fast, reliable cash-agent service over the counter.",
    prompt: "Assalam o Alaikum, mujhe JazzCash / EasyPaisa service chahiye.",
    icon: <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6H16a2 2 0 0 0 0 4h4" />,
  },
];

const TRUST = [
  { k: "Genuine", v: "Trusted brands & honest advice" },
  { k: "Fair prices", v: "Straight rates, no haggling games" },
  { k: "One WhatsApp away", v: "Ask before you visit" },
];

export default function HomePage() {
  return (
    <>
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-navy-700/60 bg-navy-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 overflow-hidden rounded-xl ring-1 ring-white/15">
              <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={40} height={40} className="h-full w-full object-cover" priority />
            </span>
            <span className="text-base font-bold tracking-tight">Hafeez Communication</span>
          </div>
          <a
            href={shopWaLink("Assalam o Alaikum Hafeez Communication!")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-dark"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in-up">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-400">
              Mobile shop · cash agent
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Accessories, used phones &amp;{" "}
              <span className="text-gold-400">easy load</span> — all in one place.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
              Hafeez Communication is your neighbourhood mobile shop. Message us
              on WhatsApp for prices, availability, or JazzCash / EasyPaisa —
              we'll reply quickly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={shopWaLink("Assalam o Alaikum, mujhe kuch maloomat chahiye.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-whatsapp/20 transition-all hover:-translate-y-0.5 hover:bg-whatsapp-dark"
              >
                <WhatsAppIcon />
                Chat on WhatsApp
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-400/40 px-5 py-3 text-sm font-semibold text-brand-400 transition-colors hover:bg-brand-400/10"
              >
                See what we offer
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              WhatsApp:{" "}
              <a href={shopWaLink()} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-400 hover:underline">
                0306 0822082
              </a>
            </p>
          </div>

          <div className="relative animate-fade-in-up md:justify-self-end">
            <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 p-6 ring-1 ring-white/10 sm:h-80 sm:w-80 motion-safe:animate-float-slow">
              <Image
                src="/HC-Logo.jpeg"
                alt="Hafeez Communication"
                width={280}
                height={280}
                className="h-full w-full rounded-2xl object-cover shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-navy-700/40 bg-navy-950/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">What we offer</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-300">
              Everything for your phone, and quick cash services — tap any card
              to message us about it.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <ScrollReveal key={s.title}>
                <a
                  href={shopWaLink(s.prompt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl border border-navy-700/60 bg-navy-800/50 p-6 transition-all hover:-translate-y-1 hover:border-brand-400/50 hover:bg-navy-800"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/25">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {s.icon}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">{s.body}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-whatsapp">
                    <WhatsAppIcon className="h-4 w-4" />
                    Ask on WhatsApp
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-navy-700/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
          {TRUST.map((t) => (
            <ScrollReveal key={t.k}>
              <div className="rounded-2xl border border-navy-700/60 bg-navy-800/30 px-6 py-5">
                <p className="text-lg font-semibold text-gold-400">{t.k}</p>
                <p className="mt-1 text-sm text-slate-300">{t.v}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-navy-700/40 bg-gradient-to-br from-brand-700/30 to-navy-950">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Need something? Just message us.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Prices, stock, or easy load — get a quick reply on WhatsApp.
          </p>
          <a
            href={shopWaLink("Assalam o Alaikum Hafeez Communication!")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-whatsapp/20 transition-all hover:-translate-y-0.5 hover:bg-whatsapp-dark"
          >
            <WhatsAppIcon />
            Chat on WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700/60 bg-navy-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/15">
              <Image src="/HC-Logo.jpeg" alt="" width={32} height={32} className="h-full w-full object-cover" />
            </span>
            <span>© {new Date().getFullYear()} Hafeez Communication</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={shopWaLink()} target="_blank" rel="noopener noreferrer" className="hover:text-brand-400">
              WhatsApp {SHOP_WHATSAPP}
            </a>
            <Link href="/login" className="hover:text-brand-400">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
