/**
 * WhatsApp is the shop's sole conversion path. Public-site CTAs link to the
 * SHOP number; credit reminders link to the CUSTOMER's own number
 * (.claude/skills/credit-and-invoicing).
 */

/** Hardcoded shop WhatsApp (CLAUDE.md). Public CTAs use this. */
export const SHOP_WHATSAPP = "923060822082";

/** Build a wa.me URL. `phone` should be international digits (no +). */
export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Public CTA to the shop, optionally with a prefilled message. */
export function shopWaLink(text?: string): string {
  return waLink(SHOP_WHATSAPP, text);
}

/** Credit-reminder message to a customer, stating their pending amount. */
export function reminderMessage(name: string, amountDue: string): string {
  return `Assalam o Alaikum ${name}, aap ka Hafeez Communication par Rs. ${amountDue} baqaya hai. Meherbani farma kar ada kar dein. Shukriya.`;
}
