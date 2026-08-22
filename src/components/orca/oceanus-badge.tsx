import { cn } from "@/lib/utils";

/**
 * "Powered by Oceanus Chain" circular badge, rebuilt as SVG from the
 * reference image (chrome ring, curved "POWERED BY" / "OCEANUS CHAIN" text,
 * glowing cyan infinity-swirl mark). This is a code-drawn approximation of
 * the reference artwork's composition, not a pixel-perfect copy — the
 * reference is a rendered/photoreal image, which SVG shapes can echo in
 * spirit but not reproduce exactly. Swap for the real exported image asset
 * when one is available for an exact match.
 */
export function OceanusChainBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("size-20", className)} role="img" aria-label="Powered by Oceanus Chain">
      <defs>
        <radialGradient id="oc-face" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#1c2430" />
          <stop offset="60%" stopColor="#0a0e16" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <linearGradient id="oc-ring" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#bfe3ff" />
          <stop offset="20%" stopColor="#2f6fe0" />
          <stop offset="50%" stopColor="#0a1a4a" />
          <stop offset="80%" stopColor="#2f6fe0" />
          <stop offset="100%" stopColor="#bfe3ff" />
        </linearGradient>
        <linearGradient id="oc-swirl" x1="10%" y1="30%" x2="95%" y2="75%">
          <stop offset="0%" stopColor="#0a2f52" />
          <stop offset="45%" stopColor="#1f8fd6" />
          <stop offset="100%" stopColor="#6fe3ff" />
        </linearGradient>
        <filter id="oc-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <path id="oc-arc-top" d="M 26 78 A 84 84 0 0 1 174 78" fill="none" />
        <path id="oc-arc-bottom" d="M 174 151 A 90 90 0 0 0 26 151" fill="none" />
      </defs>

      {/* Outer chrome ring */}
      <circle cx="100" cy="100" r="96" fill="none" stroke="url(#oc-ring)" strokeWidth="6" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#0a1a4a" strokeWidth="1.5" opacity="0.8" />

      {/* Dark badge face */}
      <circle cx="100" cy="100" r="82" fill="url(#oc-face)" stroke="#123a6a" strokeWidth="1" />

      {/* Curved labels */}
      <text fill="#eaf4ff" fontSize="15" fontWeight="700" letterSpacing="2" textAnchor="middle">
        <textPath href="#oc-arc-top" startOffset="50%">
          POWERED BY
        </textPath>
      </text>
      <text fill="#eaf4ff" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="middle">
        <textPath href="#oc-arc-bottom" startOffset="50%">
          OCEANUS CHAIN
        </textPath>
      </text>

      {/* Glowing infinity/swirl mark */}
      <g filter="url(#oc-glow)" stroke="url(#oc-swirl)" fill="none" strokeLinecap="round">
        <path d="M100 60 C 76 60, 62 76, 62 94 C 62 112, 78 124, 94 121" strokeWidth="8" />
        <path
          d="M62 94 C 78 76, 102 76, 115 92 C 128 108, 116 124, 134 124 C 147 124, 154 113, 152 100"
          strokeWidth="8"
        />
      </g>
      <circle cx="136" cy="106" r="10" fill="none" stroke="url(#oc-swirl)" strokeWidth="3.5" filter="url(#oc-glow)" />
      <circle cx="144" cy="78" r="2.4" fill="#8fe0ff" filter="url(#oc-glow)" />
      <circle cx="96" cy="124" r="1.8" fill="#8fe0ff" filter="url(#oc-glow)" />

      {/* Sparkle accents */}
      {[
        [22, 100],
        [178, 100],
      ].map(([cx, cy]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx} ${cy - 8} L${cx + 2.4} ${cy - 2.4} L${cx + 8} ${cy} L${cx + 2.4} ${cy + 2.4} L${cx} ${cy + 8} L${cx - 2.4} ${cy + 2.4} L${cx - 8} ${cy} L${cx - 2.4} ${cy - 2.4} Z`}
          fill="#bfe3ff"
          filter="url(#oc-glow)"
        />
      ))}
    </svg>
  );
}
