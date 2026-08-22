import { OrcaLogoMark } from "@/components/orca/wordmark";
import { OrcaSearchBar } from "@/components/orca/search-bar";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <OrcaLogoMark className="mb-4 size-16 drop-shadow-md" />
      <h1 className="font-pixel text-3xl leading-relaxed tracking-tight text-foreground sm:text-4xl">
        ORCA
      </h1>
      <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">See who owns the ocean.</p>
      <p className="mt-4 max-w-xl text-sm text-balance text-muted-foreground sm:text-base">
        Enter an Ethereum token contract address to see who really holds it — top holders sized by
        share of supply, plus real contract details.
      </p>

      <OrcaSearchBar className="mt-8 w-full max-w-xl" />
    </div>
  );
}
