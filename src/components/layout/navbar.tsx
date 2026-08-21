import Link from "next/link";
import { OrcaWordmark } from "@/components/orca/wordmark";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <OrcaWordmark size="sm" />
        </Link>
        <span className="text-sm text-muted-foreground">Bubble Map</span>
      </div>
    </header>
  );
}
