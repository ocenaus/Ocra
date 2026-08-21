import { OrcaSearchBar } from "@/components/orca/search-bar";

export default function HomePage() {
  return (
    <div className="ocean-depth flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-24 text-center sm:py-32">
      <p className="mb-4 text-sm font-medium tracking-widest text-primary uppercase">
        ORCA · Powered by Oceanus
      </p>
      <h1 className="text-glow text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
        Bubble Map.
      </h1>
      <p className="mt-5 max-w-xl text-balance text-muted-foreground sm:text-lg">
        Enter an Ethereum token contract address to see who really holds it — top holders sized by
        share of supply, plus real contract details.
      </p>

      <OrcaSearchBar className="mt-10 w-full max-w-2xl" />
    </div>
  );
}
