import type { Metadata } from "next";
import InstallPrompt from "@/components/install-prompt";

export const metadata: Metadata = {
  title: "Hafeez Communication — Mobile Accessories, Used Phones & Easy Load",
  description:
    "Your neighbourhood mobile shop: quality accessories, checked used phones, and JazzCash / EasyPaisa cash services. Message us on WhatsApp.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {children}
      <InstallPrompt />
    </div>
  );
}
