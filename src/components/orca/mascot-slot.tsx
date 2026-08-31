"use client";

import { useState } from "react";
import Image from "next/image";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reserved space for the real pixel-art orca mascot artwork (full-body on
 * the desktop background, and a smaller pose beside Contract Analysis).
 *
 * Pass `src` pointing at a real file under `public/` and it renders
 * automatically — no other code change needed. Until that file exists (or
 * if it fails to load for any reason), this falls back to the dashed
 * placeholder rather than showing a broken image: ORCA doesn't fake an
 * illustration it doesn't have, and it doesn't show a broken one either.
 */
export function MascotSlot({
  label = "Mascot artwork pending",
  tone = "light",
  className,
  src,
}: {
  label?: string;
  /** "light" for use over the dark sky backdrop, "dark" for use inside a white window panel. */
  tone?: "light" | "dark";
  className?: string;
  /** Path under `public/`, e.g. "/mascot-contract.png". Omit to always show the placeholder. */
  src?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div className={cn("relative overflow-hidden rounded-md", className)} role="img" aria-label={label}>
        <Image src={src} alt={label} fill sizes="224px" className="object-contain" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-3 py-4 text-center backdrop-blur-[1px]",
        tone === "light" ? "border-white/50 bg-white/10 text-white/80" : "border-border bg-secondary/60 text-muted-foreground",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <Waves className="size-6" aria-hidden="true" />
      <span className="text-[10px] leading-tight font-medium text-balance">{label}</span>
    </div>
  );
}
