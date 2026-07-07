---
name: stock-management
description: Product stock rules for Hafeez Communication — the upsert match on name+company+variant, and when to increment quantity vs only edit price/specs. Read before writing Product add/update code or UI.
---

# Stock management (Product)

Products are matched by the composite unique key **`@@unique([name, company, variant])`**.
`variant` is nullable; treat empty string as `null` so "no variant" collapses to
a single row.

## Add form (name, company, variant, category, costPrice, salePrice, quantity)

On submit, look up an existing product by `(name, company, variant)`:

- **Found** → increment `quantity` by the entered amount (restock). Prefer
  `prisma.product.upsert(...)` keyed on the composite unique with
  `update: { quantity: { increment: qty } }`. Do NOT overwrite prices on a
  restock unless the admin explicitly changed them.
- **Not found** → create a new product row with the given quantity.

Money fields are `Decimal`, never `Float`.

## Update action (separate from Add)

Editing an existing product changes price/specs (`costPrice`, `salePrice`,
`category`, `imageUrl`, etc.) and must **not** touch `quantity` unless the admin
explicitly edits the quantity field. Keep restock (quantity up) conceptually
separate from correcting details.

## Notes

- Adding stock is NOT a cash event — no `CashLedgerEntry`. Cash moves only when
  a Sale happens. (See [[cash-ledger]].)
- Selling decrements quantity and is guarded against going negative — see
  [[sale-entry]].
