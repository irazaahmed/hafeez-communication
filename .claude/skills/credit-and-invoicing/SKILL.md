---
name: credit-and-invoicing
description: Credit payment tracking, paymentStatus recomputation, per-sale invoice generation, and the WhatsApp reminder link pattern (to the CUSTOMER's number, not the shop) for Hafeez Communication. Read before writing credit/invoice/reminder code.
---

# Credit tracking, invoices & WhatsApp reminders

## Credit payments

A credit payment is a separate action against an existing credit `Sale`:

1. Validate `0 < amount <= sale.amountDue` inside the transaction.
2. Create a `CreditPayment` row.
3. `amountPaid += amount`, `amountDue -= amount`.
4. Recompute `paymentStatus`: `PAID` if `amountDue == 0`, else `PARTIAL`
   (it can never become `UNPAID` again once a payment exists).
5. Write one `CashLedgerEntry` `+amount` (`sourceType: CREDIT_PAYMENT`).

All five steps in one `prisma.$transaction`. See [[cash-ledger]].

## Pending Credits (dashboard)

List sales/customers with `amountDue > 0`, sorted **oldest due first**
(oldest `Sale.createdAt`). Each row has a **Remind** button.

## WhatsApp reminder link — CUSTOMER's number

The reminder links to the **customer's own phone**, NOT the shop number:

```
https://wa.me/<customerPhoneDigits>?text=<encoded message with pending amount>
```

Normalize the phone to international digits (strip `+`, spaces, leading `0` →
`92`). Message states their pending amount, e.g.
`Assalam o Alaikum {name}, aap ka Hafeez Communication par Rs. {amountDue}
baqaya hai. Meherbani farma kar ada kar dein. Shukriya.`

(Public-site CTAs use the SHOP number `923060822082` — reminders are the one
place we link to the customer instead.)

## Invoices

One invoice per `Sale` (single item — matches the fast entry flow). An HTML
page with a browser Print button (print-to-PDF, no PDF library). Show: shop
name/logo, date, customer name/phone if present, product, quantity, unit price,
total, payment type, `amountPaid`, `amountDue`.
