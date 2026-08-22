import Link from "next/link";
import { OrcaWordmark } from "@/components/orca/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8">
        <OrcaWordmark />
      </Link>
      <div className="xp-inset w-full max-w-sm rounded-md p-8">{children}</div>
    </div>
  );
}
