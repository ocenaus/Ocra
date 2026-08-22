import Image from "next/image";
import { OrcaLogoMark } from "@/components/orca/wordmark";
import { OrcaSearchBar } from "@/components/orca/search-bar";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <OrcaLogoMark className="mb-4 size-16 drop-shadow-md" />
        <h1 className="font-pixel text-3xl leading-relaxed tracking-tight text-foreground sm:text-4xl">
          ORCA
        </h1>
        <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">See who owns the ocean.</p>
        <p className="mt-4 text-sm font-medium text-muted-foreground sm:text-base">
          Enter an Ethereum token contract address
        </p>

        <OrcaSearchBar className="mt-8 w-full max-w-xl" />
      </div>

      <Image
        src="/oceanus-badge.png"
        alt="Powered by Oceanus Chain"
        width={200}
        height={200}
        className="size-20 shrink-0"
      />
    </div>
  );
}
