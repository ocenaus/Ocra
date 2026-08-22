import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Built entirely from the address itself — no data dependency, so these
 * always render. (DEXScreener/DEXTools may still show "not found" on their
 * own end if the token has no listed pair; that's on them, not us.)
 */
export function QuickLinks({ address }: { address: string }) {
  const links = [
    { label: "DEXScreener", href: `https://dexscreener.com/ethereum/${address}` },
    { label: "DEXTools", href: `https://www.dextools.io/app/en/ether/pair-explorer/${address}` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ label, href }) => (
        <Button key={label} variant="outline" size="sm" asChild>
          <a href={href} target="_blank" rel="noreferrer noopener">
            {label} <ExternalLink className="size-4" />
          </a>
        </Button>
      ))}
    </div>
  );
}
