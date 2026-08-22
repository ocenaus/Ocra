import { AtSign, Globe, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TokenSocials } from "@/lib/services/types";

/**
 * Renders only the links that actually resolved to a real URL. If none
 * did, renders nothing — never a placeholder or disabled icon standing in
 * for a link we don't have.
 */
export function SocialLinks({ socials }: { socials: TokenSocials }) {
  const links = [
    socials.website && { href: socials.website, label: "Website", icon: Globe },
    socials.telegram && { href: socials.telegram, label: "Telegram", icon: Send },
    socials.twitter && { href: socials.twitter, label: "X / Twitter", icon: AtSign },
  ].filter((link): link is { href: string; label: string; icon: typeof Globe } => Boolean(link));

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Button key={label} variant="outline" size="sm" asChild>
          <a href={href} target="_blank" rel="noreferrer noopener">
            <Icon className="size-4" /> {label}
          </a>
        </Button>
      ))}
    </div>
  );
}
