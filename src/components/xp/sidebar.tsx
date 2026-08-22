"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/xp/nav-items";

/**
 * Classic XP-style left sidebar. See nav-items.ts for which entries are real
 * vs. disabled placeholders.
 */
export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex w-52 shrink-0 flex-col gap-1 border-r border-border bg-[#dce9f7] p-2", className)}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive?.(pathname) ?? false;

        if (!item.href) {
          return (
            <span
              key={item.label}
              className="flex items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-sm text-muted-foreground/70"
              aria-disabled="true"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <span className="rounded-full border border-border bg-white px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "xp-titlebar-gradient text-white shadow-sm"
                : "text-foreground hover:bg-white/70",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
