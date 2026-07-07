# Hafeez Communication — Shop Management System

A full-stack management panel for **Hafeez Communication**, a mobile
accessories shop that also buys/sells used phones and works as a
JazzCash / EasyPaisa cash agent.

There is **no customer-facing ordering system** — just a public showcase page
with WhatsApp as the single conversion path. All real operations live in a
single-admin backend panel, tied together by one live cash ledger.

## What it does

- **Public showcase page** — brand-styled landing (mobile accessories, used
  phones, easy load) where every call-to-action opens WhatsApp to the shop
  number `923060822082`.
- **Stock** — add/restock accessories; adding an existing product
  (name + company + variant) increments its quantity instead of duplicating.
- **Fast sales** — one-screen single-item entry with cash/credit toggle,
  automatic stock decrement, negative-stock guard, and inline customer add.
- **Credit (udhaar)** — track partial/unpaid sales, record payments, and send a
  WhatsApp reminder to the **customer's** own number, prefilled with their
  pending amount.
- **Invoices** — one printable invoice per sale (browser print → Save as PDF).
- **JazzCash / EasyPaisa** — deposit / transfer / withdraw, with the cash
  effect always recomputed on the server.
- **Used phones** — independent buy/sell module.
- **Expenses** and **cash sessions** (open float → reconcile counted vs
  expected at close).
- **Dashboard** — live cash-in-hand, today's sales, pending credits, and recent
  cash activity.

Every cash-affecting action writes exactly one `CashLedgerEntry` inside the
same database transaction, so the running balance can never drift.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Prisma ORM 6** + **PostgreSQL (Neon)**
- **Auth.js v5** — single-admin; the first login is bootstrapped from env into
  an `AdminUser` row, after which the password is changed from `/admin/settings`
- **Tailwind CSS v4** + **next-themes**

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file (see `.env.example`):
   ```
   DATABASE_URL=your-neon-postgres-connection-string
   AUTH_SECRET=a-long-random-string
   ADMIN_EMAIL=owner@example.com
   # Bootstrap password (first login only; change later at /admin/settings).
   # Escape each `$` as `\$` in .env — Next.js expands `$` as a variable.
   ADMIN_PASSWORD_HASH=\$2a\$10\$...
   # Or, for local dev only, a plaintext password instead of the hash:
   # ADMIN_PASSWORD=changeme
   ```
   Generate a password hash with:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'your-password'
   ```
   Generate an auth secret with `npx auth secret` (or any random 32+ char string).
3. Push the schema to your database (no seed data — tables start empty):
   ```bash
   npx prisma migrate deploy   # or: npx prisma db push
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000). The admin panel is at
   `/admin` (sign in at `/login`).

## Architecture notes

- **Brand theme** lives entirely in `app/globals.css` as CSS variables /
  Tailwind aliases (`brand-*` cyan, `gold-*`, `navy-*`) — no hardcoded hex in
  components.
- **`.claude/agents`** and **`.claude/skills`** document the domain rules
  (cash ledger, sale entry, wallet formulas, mobile isolation, credit &
  invoicing, stock management) that this codebase is built around.
