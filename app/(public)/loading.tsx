import LogoLoader from "@/components/logo-loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 text-white">
      <LogoLoader />
    </div>
  );
}
