"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Minimal typing for Chrome's non-standard install prompt event.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "hc-install-dismissed";

/**
 * Floating "Install app" pill shown when Chrome offers installation
 * (beforeinstallprompt). Lets the user add Hafeez Communication to their home
 * screen for a native app feel. Hidden once installed or dismissed.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    // Already running as an installed app? Don't offer.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-navy-700/60 bg-navy-900/95 p-3 shadow-2xl backdrop-blur">
        <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
          <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Install Hafeez app</p>
          <p className="truncate text-xs text-slate-400">Add to home screen for a faster, app-like experience.</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
