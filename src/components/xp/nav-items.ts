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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
}

/**
 * Shared between the sidebar and the taskbar's Start menu so both surfaces
 * always list the same items. Only "ORCA Home" and "Bubble Map" point at
 * real functionality today; the rest are visibly disabled placeholders
 * (muted, "Soon" tag, no href) rather than links that go nowhere — ORCA
 * never presents an unbuilt feature as a working one.
 */
export const NAV_ITEMS: NavItem[] = [
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
