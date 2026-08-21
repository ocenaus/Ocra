import { OrcaWordmark } from "@/components/orca/wordmark";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <OrcaWordmark size="sm" />
          <p>Powered by Oceanus</p>
        </div>
        <a
          href="https://etherscan.io"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-foreground"
        >
          Etherscan
        </a>
        <p>© {new Date().getFullYear()} Oceanus. Analytical data, not financial advice.</p>
      </div>
    </footer>
  );
}
