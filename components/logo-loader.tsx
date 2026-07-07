import Image from "next/image";

/**
 * Branded loading indicator — the shop logo with a pulsing halo and a spinning
 * accent ring. Used by route-level loading.tsx files so navigations feel like a
 * native app rather than a blank flash.
 */
export default function LogoLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 py-16">
      <div className="relative h-20 w-20">
        {/* Pulsing halo */}
        <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-400/25" aria-hidden="true" />
        {/* Spinning accent ring */}
        <span
          className="absolute -inset-2 animate-spin rounded-full border-2 border-brand-400/20 border-t-brand-400"
          style={{ animationDuration: "0.9s" }}
          aria-hidden="true"
        />
        {/* Logo */}
        <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10 motion-safe:animate-pulse">
          <Image
            src="/HC-Logo.jpeg"
            alt="Hafeez Communication"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            priority
          />
        </span>
      </div>
      <p className="text-sm font-medium text-slate-400" role="status" aria-live="polite">
        {label}
      </p>
    </div>
  );
}
