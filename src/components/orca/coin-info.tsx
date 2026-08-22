import { AtSign, Code2, ExternalLink, Globe, MessageCircle, Send, Tag } from "lucide-react";
import { XpWindow } from "@/components/xp/xp-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/orca/stat";
import { shortenAddress } from "@/lib/format";
import type { CoinGeckoData } from "@/lib/services/types";

function explorerLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * CoinGecko's coin-level info (categories, chains it's listed on, community
 * links). Renders nothing when CoinGecko doesn't have this token.
 */
export function CoinInfoPanel({ coingecko }: { coingecko: CoinGeckoData | null }) {
  if (!coingecko) return null;
  const { info } = coingecko;

  const communityLinks = [
    info.links.website && { href: info.links.website, label: "Website", icon: Globe },
    info.links.twitter && { href: info.links.twitter, label: "X / Twitter", icon: AtSign },
    info.links.telegram && { href: info.links.telegram, label: "Telegram", icon: Send },
    info.links.reddit && { href: info.links.reddit, label: "Reddit", icon: MessageCircle },
    info.links.github && { href: info.links.github, label: "GitHub", icon: Code2 },
  ].filter((link): link is { href: string; label: string; icon: typeof Globe } => Boolean(link));

  return (
    <XpWindow title="Coin Info" icon={<Tag className="size-4 text-white" aria-hidden="true" />}>
      <div className="flex flex-col gap-4">
        <Stat label="CoinGecko ID" value={info.coingeckoId} />

        {info.categories.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs tracking-wide text-muted-foreground uppercase">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {info.categories.map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {info.chains.length > 1 && (
          <div>
            <p className="mb-1.5 text-xs tracking-wide text-muted-foreground uppercase">Also listed on</p>
            <div className="flex flex-col gap-1">
              {info.chains
                .filter((chain) => chain.platform !== "ethereum")
                .map((chain) => (
                  <p key={chain.platform} className="text-xs text-foreground">
                    <span className="font-medium capitalize">{chain.platform.replace(/-/g, " ")}</span>
                    {chain.contractAddress && (
                      <span className="ml-2 font-mono text-muted-foreground">{shortenAddress(chain.contractAddress)}</span>
                    )}
                  </p>
                ))}
            </div>
          </div>
        )}

        {info.links.explorers.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs tracking-wide text-muted-foreground uppercase">Explorers</p>
            <div className="flex flex-wrap gap-2">
              {info.links.explorers.map((url) => (
                <Button key={url} variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noreferrer noopener">
                    {explorerLabel(url)} <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        {communityLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {communityLinks.map(({ href, label, icon: Icon }) => (
              <Button key={label} variant="outline" size="sm" asChild>
                <a href={href} target="_blank" rel="noreferrer noopener">
                  <Icon className="size-4" /> {label}
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </XpWindow>
  );
}
