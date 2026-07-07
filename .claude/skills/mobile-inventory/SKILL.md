---
name: mobile-inventory
description: Used-phone buy/sell flow for Hafeez Communication and the hard rule that the Mobile module never shares fields or write paths with Product. Read before writing mobile buy/sell code.
---

# Mobile inventory (used phones)

A completely **independent** module from `Product`. Mobiles are individual used
handsets tracked one row each, not fungible stock.

## Isolation rule (do not violate)

`Mobile` must never share fields, relations, or write paths with `Product`.
A mobile buy/sell must not touch `Product.quantity`, `Sale`, `CreditPayment`,
or any product code. They only meet at `CashLedgerEntry` (both write cash
entries) and optionally `Customer`.

## Buy

Fields: `model`, `imei` (optional, unique when present), `purchasedFrom`,
`purchasePrice`. Creates `Mobile(status: IN_STOCK)` + one `CashLedgerEntry`
`-purchasePrice` (`sourceType: MOBILE_PURCHASE`), same `$transaction`.

## Sell

Pick an `IN_STOCK` mobile, enter `salePrice`, optional customer. Set
`status: SOLD`, `soldToId`, `salePrice`, `soldAt = now`. Create one
`CashLedgerEntry` `+salePrice` (`sourceType: MOBILE_SALE`), same `$transaction`.
Block selling a mobile that is already `SOLD`.

See [[cash-ledger]].
