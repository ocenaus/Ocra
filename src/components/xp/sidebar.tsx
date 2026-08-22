"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleGauge,
  FileCode2,
  FileText,
  HelpCircle,
  Settings,
  Users,
  Wallet,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: typeof Waypoints;
  isActive?: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "ORCA Home", href: "/", icon: CircleGauge, isActive: (p) => p === "/" },
  { label: "Bubble Map", href: "/", icon: Waypoints, isActive: (p) => p === "/" || p.startsWith("/token") },
  { label: "Top Holders", icon: Users },
  { label: "Wallets", icon: Wallet },
  { label: "Contract", icon: FileCode2 },
  { label: "Alerts", icon: Bell },
  { label: "Settings", icon: Settings },
  { label: "Documentation", icon: FileText },
  { label: "About ORCA", icon: HelpCircle },
];

/**
 * Classic XP-style left sidebar. Only "ORCA Home" and "Bubble Map" point at
 * real functionality today; the rest are visibly disabled placeholders
 * (muted, "Soon" tag, no href) rather than links that go nowhere — ORCA
 * never presents an unbuilt feature as a working one.
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
