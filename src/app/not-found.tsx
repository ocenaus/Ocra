import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrcaWordmark } from "@/components/orca/wordmark";

export default function NotFound() {
  return (
    <div className="ocean-depth flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <OrcaWordmark className="mb-6" />
      <h1 className="text-2xl font-semibold text-foreground">Nothing detected here.</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This page doesn&apos;t exist. Try searching for a token contract address instead.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">Back to ORCA</Link>
      </Button>
    </div>
  );
}
