---
name: sale-entry
description: The fast single-screen sale flow for Hafeez Communication — product picker, customer upsert-by-phone, cash vs credit branching, negative-stock guard, and the single cash-ledger write. Read before writing sale entry code or UI.
---

# Sale entry (fast single-item screen)

One sale = one `Sale` row (single product, matching the fast entry flow). The
screen has: searchable product picker, quantity, unit price (defaults to the
product's `salePrice`, editable), optional customer, and a cash/credit toggle.

## Customer (optional)

- Search existing by name or phone, OR inline-add. Inline-add **upserts by
  phone** (`prisma.customer.upsert({ where: { phone } })`) — never create a
  duplicate customer for a phone that already exists. See [[customer-crud]].
- A cash sale may have no customer at all (`customerId = null`).

## Quantity guard (hard block)

Before writing, re-check inside the transaction that
`product.quantity - saleQty >= 0`. If it would go negative, abort with an error
— never let stock go below zero. Decrement `Product.quantity` by `saleQty` in
the **same** transaction as the Sale.

## Cash vs credit branching

Compute `totalPrice = unitPrice * quantity` (Decimal).

- **CASH**: `amountPaid = totalPrice`, `amountDue = 0`, `paymentStatus = PAID`.
  Ledger: `+totalPrice` (`sourceType: SALE`).
- **CREDIT**: admin enters `amountPaid` (may be 0, must be `<= totalPrice`).
  `amountDue = totalPrice - amountPaid`. `paymentStatus = UNPAID` if
  `amountPaid == 0`, else `PARTIAL` (or `PAID` if fully paid — then it's
  effectively cash). Ledger: `+amountPaid` only (`sourceType: SALE`) — the
  unpaid portion is NOT cash yet.

Everything above (stock decrement, Sale insert, ledger entry) happens in one
`prisma.$transaction`. See [[cash-ledger]]. Credit follow-up payments live in
[[credit-and-invoicing]].
