import Image from "next/image";

export const metadata = { title: "Offline — Hafeez Communication" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-navy-900 px-6 text-center text-white">
      <span className="flex h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-white/15">
        <Image src="/HC-Logo.jpeg" alt="Hafeez Communication" width={80} height={80} className="h-full w-full object-cover" priority />
      </span>
      <div>
        <h1 className="text-xl font-bold">You&apos;re offline</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-400">
          No internet connection right now. Check your network and try again —
          Hafeez Communication will be right here.
        </p>
      </div>
    </main>
  );
}
