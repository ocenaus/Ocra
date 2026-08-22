import { OrcaLogoMark } from "@/components/orca/wordmark";
import { OrcaSearchBar } from "@/components/orca/search-bar";
import { MascotSlot } from "@/components/orca/mascot-slot";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <OrcaLogoMark className="mb-4 size-16 drop-shadow-md" />
      <h1 className="font-pixel text-3xl leading-relaxed tracking-tight text-foreground sm:text-4xl">
        ORCA
      </h1>
      <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">See who owns the ocean.</p>
      <p className="mt-4 text-sm font-medium text-muted-foreground sm:text-base">
        Enter an Ethereum token contract address
      </p>

      <OrcaSearchBar className="mt-8 w-full max-w-xl" />

      <MascotSlot
        label="Oceanus Chain badge — awaiting artwork"
        tone="dark"
        className="mt-6 size-20 rounded-full"
      />
    </div>
  );
}
