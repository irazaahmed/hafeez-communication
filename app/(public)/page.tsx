import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { shopWaLink, SHOP_WHATSAPP } from "@/lib/whatsapp";

/* Inline WhatsApp glyph so every green CTA reads unmistakably as WhatsApp
   without spelling the word out on every button. */
function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-2.9 4.42c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66 0 .98.72 1.93.82 2.06.1.13 1.4 2.14 3.4 3 .47.2.84.32 1.13.42.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.12-.94-.05-.08-.18-.13-.38-.23-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.51.64-.63.77-.12.13-.23.15-.43.05-.2-.1-.84-.31-1.6-.99-.6-.53-1-1.18-1.12-1.38-.12-.2-.01-.31.09-.41.09-.09.2-.23.3-.35.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.09-.62-1.49-.16-.39-.32-.34-.44-.34l-.38-.01Z" />
    </svg>
  );
}

/* A small stroke-icon helper — one <svg> wrapper, path passed as children. */
function Glyph({ children, className = "h-6 w-6" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

/* ── Content (edit these arrays to update the site) ───────────────────── */

const STATS = [
  { value: "6+", label: "Years serving locally" },
  { value: "50+", label: "Trusted brands stocked" },
  { value: "1000+", label: "Happy customers" },
  { value: "Same-day", label: "Service & easy load" },
];

const CATEGORIES = [
  { name: "Chargers & Adapters", icon: <path d="M7 8V5m10 3V5M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8ZM12 17v4" /> },
  { name: "Data Cables", icon: <path d="M8 3v4m8-4v4M8 7h8v3a4 4 0 0 1-8 0V7ZM12 14v3a3 3 0 0 0 3 3h1" /> },
  { name: "Hands-free & Earphones", icon: <path d="M4 13a8 8 0 0 1 16 0M4 13v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 1Zm16 0v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 1Z" /> },
  { name: "Covers & Cases", icon: <path d="M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM10.5 5.5h3" /> },
  { name: "Glass Protectors", icon: <path d="M6 3h12l-1 11a5 5 0 0 1-10 0L6 3ZM9 8l2 2 4-4" /> },
  { name: "Power Banks", icon: <path d="M5 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm15 3v4M8 10v4M11 10v4" /> },
  { name: "Bluetooth Devices", icon: <path d="m8 7 8 5-4 3V4l4 3-8 5" /> },
  { name: "Memory Cards & USB", icon: <path d="M8 3h6l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h1Zm2 0v3m3-3v3" /> },
];

const SERVICES = [
  {
    title: "Mobile Accessories",
    body: "Chargers, cables, hands-free, covers, glass protectors and power banks — all leading brands at fair, fixed prices.",
    prompt: "Assalam o Alaikum, mujhe mobile accessories chahiye.",
    cta: "Ask for price",
    icon: <path d="M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm4 17h4" />,
  },
  {
    title: "Used Phones — Buy & Sell",
    body: "Quality-checked second-hand handsets with clear pricing. Selling your old phone? Bring it in for a fair offer.",
    prompt: "Assalam o Alaikum, mujhe used phone ke baare mein poochna hai.",
    cta: "Get a quote",
    icon: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 12v9M12 12 4 7.5M12 12l8-4.5" />,
  },
  {
    title: "JazzCash / EasyPaisa",
    body: "Easy load, deposits, withdrawals and money transfer. Fast, reliable cash-agent service over the counter.",
    prompt: "Assalam o Alaikum, mujhe JazzCash / EasyPaisa service chahiye.",
    cta: "Send money",
    icon: <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6H16a2 2 0 0 0 0 4h4" />,
  },
];

const WHY_US = [
  { title: "Genuine products", body: "Only trusted brands and honest advice — no fakes, no pressure.", icon: <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3ZM9 12l2 2 4-4" /> },
  { title: "Fair, fixed prices", body: "Straight rates with no haggling games — you pay what locals pay.", icon: <path d="M7 7h.01M20 13.5 13.5 20a2 2 0 0 1-2.8 0l-6.7-6.7A2 2 0 0 1 3.4 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l6.2 6.2a2 2 0 0 1 0 2.7Z" /> },
  { title: "Quick replies", body: "Message before you visit — get price and availability in minutes.", icon: <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1Z" /> },
  { title: "Trusted local shop", body: "A neighbourhood name people come back to, year after year.", icon: <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /> },
];

/* ── Reusable WhatsApp button ─────────────────────────────────────────── */
function WaButton({
  text,
  children,
  size = "md",
  variant = "solid",
}: {
  text?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "ghost";
}) {
  const sizes = { sm: "px-3.5 py-2 text-sm", md: "px-5 py-3 text-sm", lg: "px-6 py-3.5 text-base" };
  const style =
    variant === "solid"
      ? "bg-whatsapp text-white shadow-lg shadow-whatsapp/20 hover:-translate-y-0.5 hover:bg-whatsapp-dark"
      : "border border-whatsapp/40 text-whatsapp hover:bg-whatsapp/10";
  return (
    <a
      href={shopWaLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${sizes[size]} ${style}`}
    >
      <WhatsAppIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      {children}
    </a>
  );
}

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-navy-700/60 bg-navy-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
              <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={40} height={40} className="h-full w-full object-cover" priority />
            </span>
            <span className="text-sm font-bold leading-tight tracking-tight sm:text-base">
              Hafeez<span className="hidden min-[380px]:inline"> Communication</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <a href="#categories" className="transition-colors hover:text-brand-400">Categories</a>
            <a href="#services" className="transition-colors hover:text-brand-400">Services</a>
            <a href="#why" className="transition-colors hover:text-brand-400">Why us</a>
            <a href="#visit" className="transition-colors hover:text-brand-400">Visit</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-brand-400/50 hover:text-brand-400 sm:inline-flex"
            >
              <Glyph className="h-4 w-4"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></Glyph>
              Admin
            </Link>
            <WaButton size="sm" text="Assalam o Alaikum Hafeez Communication!">
              <span className="hidden sm:inline">Message us</span>
              <span className="sm:hidden">Chat</span>
            </WaButton>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-400">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Mobile shop &amp; cash agent
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Accessories, used phones &amp;{" "}
              <span className="text-gold-400">easy load</span> — all in one shop.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
              Hafeez Communication is your neighbourhood mobile shop. Message us
              for prices, availability, or JazzCash&nbsp;/&nbsp;EasyPaisa — you'll
              get a quick reply, every time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <WaButton size="lg" text="Assalam o Alaikum, mujhe kuch maloomat chahiye.">
                Message us on WhatsApp
              </WaButton>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-400/40 px-5 py-3.5 text-sm font-semibold text-brand-400 transition-colors hover:bg-brand-400/10"
              >
                Browse categories
                <span aria-hidden>→</span>
              </a>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Call or WhatsApp:{" "}
              <a href={shopWaLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-400 hover:underline">
                0306 0822082
              </a>
            </p>
          </div>

          {/* Hero visual — branded card with floating category chips */}
          <div className="relative animate-fade-in-up md:justify-self-end">
            <div className="relative mx-auto flex h-72 w-72 items-center justify-center rounded-[2rem] bg-gradient-to-br from-navy-800 to-navy-950 p-6 ring-1 ring-white/10 sm:h-80 sm:w-80">
              <div className="motion-safe:animate-float-slow">
                <Image
                  src="/HC-Logo.jpeg"
                  alt="Hafeez Communication"
                  width={280}
                  height={280}
                  className="h-full w-full rounded-2xl object-cover shadow-2xl"
                  priority
                />
              </div>
              <span className="absolute -left-4 top-8 hidden rounded-xl border border-white/10 bg-navy-900/90 px-3 py-2 text-xs font-semibold text-brand-400 shadow-xl backdrop-blur sm:block">
                ⚡ Easy load
              </span>
              <span className="absolute -right-4 bottom-10 hidden rounded-xl border border-white/10 bg-navy-900/90 px-3 py-2 text-xs font-semibold text-gold-400 shadow-xl backdrop-blur sm:block">
                📱 Used phones
              </span>
              <span className="absolute -bottom-4 left-12 hidden rounded-xl border border-white/10 bg-navy-900/90 px-3 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur sm:block">
                🔌 Accessories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────────────── */}
      <section className="border-y border-navy-700/40 bg-navy-950/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 py-2 sm:px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-6 text-center">
              <p className="text-2xl font-bold tracking-tight text-brand-400 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────── */}
      <section id="categories" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">Popular categories</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-300">
              Everything for your phone under one roof. Tap a category to ask for
              price &amp; availability.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {CATEGORIES.map((c) => (
              <ScrollReveal key={c.name}>
                <a
                  href={shopWaLink(`Assalam o Alaikum, mujhe "${c.name}" chahiye. Price bata dein?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-navy-700/60 bg-navy-800/50 p-4 transition-all hover:-translate-y-1 hover:border-brand-400/50 hover:bg-navy-800 sm:p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/25 transition-colors group-hover:bg-brand-400/25">
                    <Glyph>{c.icon}</Glyph>
                  </span>
                  <span className="text-sm font-semibold leading-snug sm:text-base">{c.name}</span>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────── */}
      <section id="services" className="scroll-mt-20 border-t border-navy-700/40 bg-navy-950/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">What we offer</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-300">
              Three things we do well — from your first accessory to your next cash transfer.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <ScrollReveal key={s.title}>
                <div className="group flex h-full flex-col rounded-2xl border border-navy-700/60 bg-navy-800/50 p-6 transition-all hover:-translate-y-1 hover:border-brand-400/50 hover:bg-navy-800">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/25">
                    <Glyph>{s.icon}</Glyph>
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">{s.body}</p>
                  <a
                    href={shopWaLink(s.prompt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-whatsapp/10 px-3.5 py-2 text-sm font-semibold text-whatsapp transition-colors hover:bg-whatsapp hover:text-white"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {s.cta}
                    <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                  </a>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ──────────────────────────────────────────────────── */}
      <section id="why" className="scroll-mt-20 border-t border-navy-700/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">Why people choose Hafeez</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => (
              <ScrollReveal key={w.title}>
                <div className="flex h-full flex-col rounded-2xl border border-navy-700/60 bg-navy-800/30 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/25">
                    <Glyph>{w.icon}</Glyph>
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{w.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Visit / contact ─────────────────────────────────────────── */}
      <section id="visit" className="scroll-mt-20 border-t border-navy-700/40 bg-navy-950/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight">Visit or message us</h2>
            <p className="mt-3 max-w-md text-slate-300">
              Drop by the shop, or send a WhatsApp before you come so we can keep
              what you need ready.
            </p>
            <dl className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/25">
                  <Glyph className="h-5 w-5"><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></Glyph>
                </span>
                <div>
                  <dt className="text-sm font-semibold text-white">Where</dt>
                  <dd className="text-sm text-slate-300">Main Bazaar — ask on WhatsApp for exact location &amp; landmarks.</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/25">
                  <Glyph className="h-5 w-5"><path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /></Glyph>
                </span>
                <div>
                  <dt className="text-sm font-semibold text-white">Open hours</dt>
                  <dd className="text-sm text-slate-300">Monday – Sunday · 10:00 AM – 10:00 PM</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/25">
                  <Glyph className="h-5 w-5"><path d="M4 5a2 2 0 0 1 2-2h2l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 5Z" /></Glyph>
                </span>
                <div>
                  <dt className="text-sm font-semibold text-white">Call / WhatsApp</dt>
                  <dd className="text-sm text-slate-300">0306 0822082</dd>
                </div>
              </div>
            </dl>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex h-full flex-col justify-center rounded-2xl border border-navy-700/60 bg-gradient-to-br from-navy-800 to-navy-950 p-8 text-center ring-1 ring-white/5">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-whatsapp/15 text-whatsapp ring-1 ring-whatsapp/30">
                <WhatsAppIcon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-xl font-bold">The fastest way to reach us</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-300">
                Prices, stock, easy load or a used-phone quote — one message and we'll reply.
              </p>
              <div className="mt-6 flex justify-center">
                <WaButton size="lg" text="Assalam o Alaikum Hafeez Communication!">
                  Start a chat
                </WaButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────── */}
      <section className="border-t border-navy-700/40 bg-gradient-to-br from-brand-700/30 to-navy-950">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Need something? Just message us.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Genuine products, fair prices and a quick reply — that's the Hafeez promise.
          </p>
          <div className="mt-7 flex justify-center">
            <WaButton size="lg" text="Assalam o Alaikum Hafeez Communication!">
              Chat with us now
            </WaButton>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-navy-700/60 bg-navy-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/15">
                  <Image src="/HC-Logo.jpeg" alt="" width={36} height={36} className="h-full w-full object-cover" />
                </span>
                <span className="text-sm font-bold">Hafeez Communication</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Mobile accessories, used phones and JazzCash / EasyPaisa cash
                services — your neighbourhood mobile shop.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm sm:gap-14">
              <div>
                <p className="font-semibold text-white">Explore</p>
                <ul className="mt-3 space-y-2 text-slate-400">
                  <li><a href="#categories" className="hover:text-brand-400">Categories</a></li>
                  <li><a href="#services" className="hover:text-brand-400">Services</a></li>
                  <li><a href="#why" className="hover:text-brand-400">Why us</a></li>
                  <li><a href="#visit" className="hover:text-brand-400">Visit</a></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white">Contact</p>
                <ul className="mt-3 space-y-2 text-slate-400">
                  <li>
                    <a href={shopWaLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-whatsapp">
                      <WhatsAppIcon className="h-4 w-4" /> {SHOP_WHATSAPP}
                    </a>
                  </li>
                  <li>Mon – Sun · 10 AM – 10 PM</li>
                  <li><Link href="/login" className="hover:text-brand-400">Admin login</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-navy-700/60 pt-6 text-center text-xs text-slate-500">
            © {year} Hafeez Communication. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
