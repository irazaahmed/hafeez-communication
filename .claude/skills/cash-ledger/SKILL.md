---
name: cash-ledger
description: Single-source-of-truth cash rules for Hafeez Communication — exactly one CashLedgerEntry per cash-affecting action, balanceAfter math, and cash-session open/close reconciliation. Read before writing any code that moves cash.
---

# Cash Ledger — single source of truth

`CashLedgerEntry` is the ONLY record of the shop's cash position. The live
balance is `sum(amount)` over all entries (equivalently, the `balanceAfter` of
the most recent entry). Never store a running balance anywhere else.

## The one rule

Every cash-affecting write creates **exactly one** `CashLedgerEntry`, inside the
**same** `prisma.$transaction` as the domain write. Never in a second code
path, never conditionally skipped, never duplicated.

Use the shared helper `appendCashLedger(tx, { sourceType, sourceId, amount, note })`
in `lib/ledger.ts` — do not hand-roll ledger inserts. It:

1. reads the latest entry's `balanceAfter` (0 if none) **inside the tx**,
2. computes `balanceAfter = previous + amount`,
3. inserts the row.

`amount` is signed: **positive = cash in**, **negative = cash out**.

## sourceType values (exact strings)

`SALE`, `CREDIT_PAYMENT`, `EXPENSE`, `WALLET_TXN`, `MOBILE_PURCHASE`,
`MOBILE_SALE`, `SESSION_OPEN`, `SESSION_CLOSE`, `MANUAL`.

## Amount signs per action

| Action | amount |
|---|---|
| Cash sale | `+amountPaid` (cash portion only) |
| Credit sale | `+amountPaid` (0 if nothing paid up front) |
| Credit payment | `+amount` received |
| Expense | `-amount` |
| Wallet txn | `+cashEffect` (server-recomputed; see wallet-transactions) |
| Mobile purchase | `-purchasePrice` |
| Mobile sale | `+salePrice` |
| Session open | `+openingAmount` |

## Cash sessions

- **Open**: enforce only ONE open session (`closedAt = null`) at a time. Create
  `CashSession` + a `SESSION_OPEN` ledger entry for `+openingAmount`.
- **Close**: `expectedAmount = sum of ledger entries created since openedAt`
  (this already includes the opening entry). `difference = closingAmount -
  expectedAmount`. Store all three on the session. Do **not** write a ledger
  entry that alters the balance on close — the count is a reconciliation, not a
  cash movement. (A `SESSION_CLOSE` entry with `amount = 0` for audit only is
  acceptable, but never a non-zero adjustment.)
- The dashboard shows the **live** running balance (full ledger sum) at all
  times, not just at session close.
