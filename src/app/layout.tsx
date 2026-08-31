import type { Metadata } from "next";
import { Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/xp/sidebar";
import { Taskbar } from "@/components/xp/taskbar";
import { DecorativeTitlebarControls } from "@/components/xp/decorative-titlebar-controls";
import { OrcaLogoMark, OrcaWordmark } from "@/components/orca/wordmark";
import { MascotSlot } from "@/components/orca/mascot-slot";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ORCA Ocean Map — Token Holder Intelligence by Oceanus",
    template: "%s · ORCA",
  },
  description: "See who really holds an Ethereum token — an interactive holder ocean map with real contract data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} ${pressStart.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col items-center bg-[var(--xp-sky-horizon)] px-3 pt-6 pb-14 sm:px-6">
        <div className="xp-desktop fixed inset-0 -z-10 overflow-hidden" aria-hidden="true" />
        <MascotSlot
          label="Mascot artwork pending — full-body orca on the grass"
          src="/mascot-full.png"
          className="pointer-events-none fixed bottom-20 left-8 hidden h-56 w-32 2xl:flex"
        />

        <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[8px] border border-[#0a3aa0] shadow-[0_18px_50px_rgba(6,20,55,0.45)]">
          <div className="xp-titlebar-gradient flex items-center justify-between gap-2 px-3 py-1.5">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
              <OrcaLogoMark className="size-4 shrink-0" />
              <span className="truncate">ORCA by Oceanus chain</span>
            </div>
            <DecorativeTitlebarControls />
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-border bg-[var(--xp-chrome)] px-4 py-2">
            <OrcaWordmark size="sm" />
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] font-medium tracking-widest text-muted-foreground uppercase sm:inline">
                Ocean Intelligence · Ethereum Analytics
              </span>
              <span className="flex size-6 items-center justify-center rounded-full border border-border bg-white text-xs font-bold text-foreground">
                ?
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <Sidebar className="hidden sm:flex" />
            <main className="flex min-w-0 flex-1 flex-col bg-[var(--color-background)] p-4 sm:p-6">{children}</main>
          </div>
        </div>

        <Taskbar />
      </body>
    </html>
  );
}
