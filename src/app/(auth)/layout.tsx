import Link from "next/link";
import { OrcaWordmark } from "@/components/orca/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ocean-depth flex min-h-[calc(100vh-1px)] flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8">
        <OrcaWordmark />
      </Link>
      <div className="glass-panel w-full max-w-sm rounded-xl p-8">{children}</div>
    </div>
  );
}
