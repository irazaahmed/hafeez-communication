---
name: wallet-transactions
description: JazzCash / EasyPaisa cash-effect formulas for Hafeez Communication and the rule that cashEffect is always server-recomputed, never trusted from the client. Read before writing wallet transaction code.
---

# Wallet transactions (JazzCash / EasyPaisa)

The shop acts as a cash agent. A `WalletTransaction` records provider
(`JAZZCASH` | `EASYPAISA`), type (`DEPOSIT` | `TRANSFER` | `WITHDRAW`),
`amount`, `charges`, and an optional customer.

## cashEffect is server-computed — ALWAYS

Never trust a `cashEffect` sent from the client. The server recomputes it from
`type`, `amount`, and `charges` every time and stores that:

| type | cashEffect |
|---|---|
| `DEPOSIT`  | `amount + charges` |
| `TRANSFER` | `charges` |
| `WITHDRAW` | `-(amount - charges)` |

Rationale: a deposit (customer hands cash to put into their wallet) brings
`amount` into the drawer plus the `charges` fee. A transfer moves money
digitally so only the `charges` fee hits the drawer. A withdraw pays out
`amount` in cash but keeps the `charges` fee, so the net drawer effect is
negative.

All amounts are `Decimal`, never `Float`.

## Ledger

Write exactly one `CashLedgerEntry` with `amount = cashEffect` and
`sourceType: WALLET_TXN`, in the same `$transaction` as the `WalletTransaction`
insert. See [[cash-ledger]].
