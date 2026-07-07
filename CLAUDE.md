# Hafeez Communication — CLAUDE.md

## 0. Replace Existing Agents/Skills (do this before anything else)

This project is forked from Huzaifa Traders. That codebase may already contain `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` (or a `/skills` folder) built for Huzaifa Traders' domain (invoicing, reminders, customer portal).

**Delete all of those first.** Do not merge, do not extend, do not keep any old agent or skill file around "just in case". This is a different business domain and old logic will actively mislead future work here. Once deleted, create the new agents and skills listed in Sections 5 and 6 from scratch, based only on this file.

---

## 1. Project Overview

Hafeez Communication is a mobile accessories shop. It also buys/sells used phones and acts as a JazzCash/EasyPaisa cash agent. There is no customer-facing ordering system, only a public showcase page with WhatsApp as the sole conversion path. All real operations live in a single-admin backend panel.

Stack: Next.js (App Router), Prisma, Neon Postgres, deployed on Vercel. `DATABASE_URL` will be provided manually by Ahmed after he creates the Neon project himself. Do not auto-provision or assume a database, just read from env.

WhatsApp number (hardcoded everywhere): `923060822082`. All CTAs use `https://wa.me/923060822082`, with `?text=` prefilled where context is available (product name, pending credit amount, etc).

**No seed data anywhere.** Build full functionality on empty tables. Real data will be entered manually after handoff.

---

## 2. Brand Theme (locked, derived from uploaded logo)

- Background: dark navy `#0E2A3D`
- Primary accent: cyan/teal `#61B1CA` (CTAs, links, highlights, WhatsApp button)
- Secondary accent: gold `#B48C4C` (sparingly, badges, price emphasis, premium touches)
- Text: white `#FFFFFF`, muted grey-blue for secondary text
- Keep all of the above as CSS variables / design tokens in one central theme file, never hardcode hex values in component files, so the palette can be adjusted later without touching every component.

---

## 3. Database Schema

Use Decimal for all money fields, never Float.

```prisma
model Product {
  id         String    @id @default(cuid())
  name       String
  company    String
  variant    String?
  category   String
  costPrice  Decimal
  salePrice  Decimal
  quantity   Int
  imageUrl   String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  sales      Sale[]

  @@unique([name, company, variant])
}

model Customer {
  id         String        @id @default(cuid())
  name       String
  phone      String        @unique
  createdAt  DateTime      @default(now())
  sales      Sale[]
  walletTxns WalletTransaction[]
  mobiles    Mobile[]
}

enum PaymentType {
  CASH
  CREDIT
}

enum PaymentStatus {
  PAID
  PARTIAL
  UNPAID
}

model Sale {
  id            String          @id @default(cuid())
  productId     String
  product       Product         @relation(fields: [productId], references: [id])
  quantity      Int
  unitPrice     Decimal
  totalPrice    Decimal
  customerId    String?
  customer      Customer?       @relation(fields: [customerId], references: [id])
  paymentType   PaymentType     @default(CASH)
  amountPaid    Decimal         @default(0)
  amountDue     Decimal         @default(0)
  paymentStatus PaymentStatus   @default(PAID)
  createdAt     DateTime        @default(now())
  payments      CreditPayment[]
}

model CreditPayment {
  id        String   @id @default(cuid())
  saleId    String
  sale      Sale     @relation(fields: [saleId], references: [id])
  amount    Decimal
  createdAt DateTime @default(now())
}

enum WalletTxnType {
  DEPOSIT
  TRANSFER
  WITHDRAW
}

enum WalletProvider {
  JAZZCASH
  EASYPAISA
}

model WalletTransaction {
  id         String          @id @default(cuid())
  type       WalletTxnType
  provider   WalletProvider
  amount     Decimal
  charges    Decimal
  cashEffect Decimal
  customerId String?
  customer   Customer?       @relation(fields: [customerId], references: [id])
  createdAt  DateTime        @default(now())
}

enum MobileStatus {
  IN_STOCK
  SOLD
}

model Mobile {
  id            String        @id @default(cuid())
  model         String
  imei          String?       @unique
  purchasedFrom String
  purchasePrice Decimal
  status        MobileStatus  @default(IN_STOCK)
  soldToId      String?
  soldTo        Customer?     @relation(fields: [soldToId], references: [id])
  salePrice     Decimal?
  purchasedAt   DateTime      @default(now())
  soldAt        DateTime?
}

model Expense {
  id        String   @id @default(cuid())
  category  String
  amount    Decimal
  note      String?
  createdAt DateTime @default(now())
}

model CashLedgerEntry {
  id           String   @id @default(cuid())
  sourceType   String   // SALE, CREDIT_PAYMENT, EXPENSE, WALLET_TXN, MOBILE_PURCHASE, MOBILE_SALE, SESSION_OPEN, SESSION_CLOSE, MANUAL
  sourceId     String?
  amount       Decimal
  balanceAfter Decimal
  note         String?
  createdAt    DateTime @default(now())
}

model CashSession {
  id             String    @id @default(cuid())
  openedAt       DateTime  @default(now())
  openingAmount  Decimal
  closedAt       DateTime?
  closingAmount  Decimal?
  expectedAmount Decimal?
  difference     Decimal?
}
```

Every cash-affecting write must happen inside a Prisma `$transaction` alongside its `CashLedgerEntry`. Never update cash balance in more than one code path. `balanceAfter` is always previous `balanceAfter + amount`.

---

## 4. Business Logic

### Stock (Product)
Add form: name, company, variant, category, costPrice, salePrice, quantity. On submit, match against `@@unique([name, company, variant])`. If found, increment quantity (upsert). If not found, create new row. Separate "Update" action edits price/specs without touching quantity unless explicitly changed.

### Sale entry
Single fast screen: searchable product picker, quantity, unit price (defaults to `salePrice`, editable), optional customer (search existing by name/phone or inline-add which upserts by phone), payment type toggle (cash/credit).

- Cash sale: `amountPaid = totalPrice`, `amountDue = 0`, `paymentStatus = PAID`, ledger `+totalPrice`.
- Credit sale: admin enters `amountPaid` (can be 0), `amountDue = totalPrice - amountPaid`, `paymentStatus` = PARTIAL or UNPAID, ledger only gets `+amountPaid`.
- Block sale if `Product.quantity` would go negative.
- Decrement `Product.quantity` by sold quantity in the same transaction.

### Credit payments
Separate action against an existing credit `Sale`: enter amount received, create `CreditPayment`, increase `Sale.amountPaid`, decrease `amountDue`, recompute `paymentStatus`, write `CashLedgerEntry(+amount, sourceType: CREDIT_PAYMENT)`.

Dashboard section "Pending Credits": list customers with `amountDue > 0` across their sales, sorted oldest due first, each row has a "Remind" button that opens a `wa.me` link to the customer's own phone number (not the shop number) prefilled with a message stating their pending amount.

### Invoices
One invoice per `Sale` record (single item, matches the fast entry flow). HTML invoice page with a print button (browser print-to-PDF, no extra PDF library needed). Shows: shop name/logo, date, customer name/phone if present, product, quantity, unit price, total, payment type, amountPaid, amountDue.

### JazzCash / EasyPaisa
Form: provider, type, amount, charges, optional customer. Server recomputes `cashEffect`, never trusts client value:
- `DEPOSIT`: `cashEffect = amount + charges`
- `TRANSFER`: `cashEffect = charges`
- `WITHDRAW`: `cashEffect = -(amount - charges)`

### Customers
Standalone CRUD (name, phone, created date, computed total outstanding credit). Same upsert-by-phone logic as the sale form.

### Mobile buy/sell
Independent module, no shared fields with `Product`. Buy: model, imei (optional), purchasedFrom, purchasePrice, creates `Mobile(status: IN_STOCK)` + `CashLedgerEntry(-purchasePrice)`. Sell: pick an in-stock mobile, salePrice, optional customer, sets `status: SOLD`, `soldToId`, `salePrice`, `soldAt`, creates `CashLedgerEntry(+salePrice)`.

### Expenses
Category, amount, note. Creates `Expense` + `CashLedgerEntry(-amount)`.

### Cash sessions
Open: admin enters opening cash, creates `CashSession` + `CashLedgerEntry(+openingAmount)`. Only one open session at a time. Close: admin enters counted cash, system computes `expectedAmount` from ledger sum since open, `difference = closingAmount - expectedAmount`. Dashboard always shows live running balance (sum of all ledger entries), not just at session close.

---

## 5. Subagents to Create (`.claude/agents/*.md`)

Create exactly these five, each with proper frontmatter (`name`, `description`, `tools`) and a system prompt scoped to only its phase. No agent should touch cash-ledger-writing logic except backend-agent.

1. **schema-agent**: owns the Prisma schema in Section 3, migrations, zero seed data.
2. **backend-agent**: owns all business logic in Section 4, all API routes, all `CashLedgerEntry` writes. This is the only agent allowed to write cash math.
3. **admin-ui-agent**: owns the admin panel screens (dashboard, stock, sale entry, credits, wallet, customers, mobiles, expenses, cash sessions). Dense, fast, functional UI, not marketing polish.
4. **landing-ui-agent**: owns the public page, brand theme tokens from Section 2, lightweight CSS/Framer Motion hero animation, WhatsApp CTAs.
5. **qa-agent**: runs after the other four are functionally complete. Checks negative stock, double cash entries, credit math correctness, customer upsert dedup, mobile module isolation from Product. Reports issues back to the owning agent instead of silently patching across scope.

---

## 6. Skills to Create (`.claude/skills/<name>/SKILL.md`)

Create exactly these six, each with proper frontmatter (`name`, `description`) so they trigger correctly for the relevant agent. Every subagent must read whichever of these applies to its phase before writing code.

1. **stock-management**: the upsert rule (match on name+company+variant), when to increment quantity vs when to just edit price/specs.
2. **sale-entry**: the fast single-screen flow, customer upsert-by-phone, cash vs credit branching, quantity guard against negative stock.
3. **wallet-transactions**: the three JazzCash/EasyPaisa cash-effect formulas, and the rule that `cashEffect` is always server-recomputed, never trusted from the client.
4. **mobile-inventory**: buy/sell flow, and the rule that this module must never share fields or write paths with `Product`.
5. **credit-and-invoicing**: credit payment tracking, `paymentStatus` recomputation, invoice generation pattern, and the WhatsApp reminder link pattern (linking to the customer's number, not the shop's).
6. **cash-ledger**: the single-source-of-truth rule, exactly one `CashLedgerEntry` per cash-affecting action, `balanceAfter` computation, and the cash session open/close reconciliation math.

---

## 7. Build Order

1. Section 0 cleanup (delete old agents/skills, strip Huzaifa Traders customer portal/multi-item invoicing/reminders).
2. schema-agent runs Section 3.
3. backend-agent runs Section 4, guided by skills 1, 2, 3, 4, 5, 6.
4. admin-ui-agent and landing-ui-agent run in parallel once backend routes exist.
5. qa-agent runs last, against all of the above.
