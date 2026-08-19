"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classifySearchInput } from "@/lib/validation/ethereum";

export function OrcaSearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    const type = classifySearchInput(trimmed);

    if (type === "invalid") {
      setError("Enter a valid Ethereum address, token contract, or ENS name.");
      return;
    }

    setError(null);
    // Wallet vs. token can't be distinguished from the address alone —
    // the wallet scanner route detects contract addresses and offers to
    // open the token view instead.
    router.push(`/wallet/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search wallet, token contract or ENS..."
            className="h-12 pl-10 text-base"
            aria-label="Search wallet, token contract or ENS"
          />
        </div>
        <Button type="submit" size="lg" className="h-12">
          Analyze
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
