"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteWalletTxn } from "@/lib/actions/wallet";
import type { FormState } from "@/lib/actions/utils";
import { FormError } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Confirm delete"}
    </button>
  );
}

/**
 * Per-row delete control. Collapsed to a single icon button by default so a
 * stray click can't do anything; expanding it requires re-entering the admin
 * password, which the server re-verifies before reversing the cash effect.
 */
export default function DeleteWalletTxn({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(deleteWalletTxn, undefined);

  if (state?.ok) return <span className="text-xs text-slate-400">Deleted</span>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col items-end gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-left dark:border-red-900/60 dark:bg-red-950/30"
    >
      <input type="hidden" name="id" value={id} />
      <p className="w-56 text-xs text-red-700 dark:text-red-300">
        This reverses the cash effect of <span className="font-medium">{label}</span>. Enter your
        password to confirm.
      </p>
      <PasswordInput name="password" autoComplete="current-password" required className="w-56 text-sm" />
      <FormError message={state?.error} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <ConfirmDeleteButton />
      </div>
    </form>
  );
}
