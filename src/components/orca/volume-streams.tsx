"use client";

import { useMemo, useState } from "react";
import type { PairVolume } from "@/lib/services/types";
import { computeStreamWidths } from "@/lib/services/token/math";
import { formatCompactNumber, formatUsd } from "@/lib/format";

const WIDTH = 720;
// Tall enough to give up to 8 streams (the orchestrator's combined DEX+CEX
// cap) generous row spacing for single-line labels — see MIN_ROW_SPACING.
const HEIGHT = 600;
const HARBOR_X = WIDTH * 0.82;
const HARBOR_Y = HEIGHT / 2;
const HARBOR_RADIUS = 34;
const MIN_ROW_SPACING = 70;

const DEX_BUY_COLOR = "#199e70";
const DEX_SELL_COLOR = "#e66767";
const CEX_COLOR = "#3987e5";

/** Dark halo behind label text so it stays legible over any stream color or the background gradient. */
const TEXT_HALO = { stroke: "#041a42", strokeWidth: 3, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

interface StreamLayout {
  pair: PairVolume;
  path: string;
  width: number;
  originX: number;
  originY: number;
  buyRatio: number | null;
  /** Deterministic per-stream animation timing (from index/width, never Math.random — avoids SSR/hydration mismatches). */
  flowDurationS: number;
  bobDurationS: number;
  bobDelayS: number;
}

function buildPath(originX: number, originY: number): string {
  // A flatter, longer runway near the origin (control point at 32%, not
  // 55%) keeps each stream closer to its own row for longer before curving
  // toward the harbor — earlier crossings were sweeping straight through
  // neighboring rows' label text.
  const c1x = originX + (HARBOR_X - originX) * 0.32;
  const c2x = originX + (HARBOR_X - originX) * 0.85;
  return `M ${originX} ${originY} C ${c1x} ${originY}, ${c2x} ${HARBOR_Y}, ${HARBOR_X - HARBOR_RADIUS - 4} ${HARBOR_Y}`;
}

export function VolumeStreams({ pairs, symbol }: { pairs: PairVolume[]; symbol: string | null }) {
  const [hovered, setHovered] = useState<PairVolume | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const { streams, totalVolumeUsd24h } = useMemo(() => {
    const widths = computeStreamWidths(pairs.map((p) => p.volumeUsd24h));
    const maxWidth = widths.length > 0 ? Math.max(...widths) : 1;
    const marginY = 40;
    const usableHeight = HEIGHT - marginY * 2;
    const step = pairs.length > 1 ? Math.max(usableHeight / (pairs.length - 1), MIN_ROW_SPACING) : 0;

    const layouts: StreamLayout[] = pairs.map((pair, i) => {
      const originY = pairs.length === 1 ? HEIGHT / 2 : marginY + step * i;
      const originX = 6;
      const totalTxns = (pair.buyTxns24h ?? 0) + (pair.sellTxns24h ?? 0);
      return {
        pair,
        path: buildPath(originX, originY),
        width: widths[i],
        originX,
        originY,
        buyRatio: pair.source === "dex" && totalTxns > 0 ? (pair.buyTxns24h ?? 0) / totalTxns : null,
        // Wider (higher-volume) streams flow visibly faster, like a
        // stronger current; index-based bob duration/phase gives each
        // stream a slightly different sway instead of moving in lockstep.
        flowDurationS: Math.max(1.1, 2.3 - (widths[i] / maxWidth) * 1.1),
        bobDurationS: 2.6 + (i % 3) * 0.5,
        bobDelayS: -(i * 0.37),
      };
    });

    return {
      streams: layouts,
      totalVolumeUsd24h: pairs.reduce((sum, p) => sum + p.volumeUsd24h, 0),
    };
  }, [pairs]);

  if (pairs.length === 0) return null;

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-[#0a3aa0]/40">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block w-full"
          style={{ maxHeight: HEIGHT }}
          role="img"
          aria-label="Token 24h trading volume by exchange, DEX and CEX combined"
        >
          <defs>
            <radialGradient id="stream-canvas-bg" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#123a7a" />
              <stop offset="100%" stopColor="#041a42" />
            </radialGradient>
            <radialGradient id="stream-harbor" cx="38%" cy="32%">
              <stop offset="0%" stopColor="#bfe0ff" />
              <stop offset="45%" stopColor="#4fa3f7" />
              <stop offset="85%" stopColor="#1457d6" />
              <stop offset="100%" stopColor="#0a3aa0" />
            </radialGradient>
            {streams.map((s, i) =>
              s.pair.source === "dex" && s.buyRatio !== null ? (
                <linearGradient
                  key={`grad-${i}`}
                  id={`stream-grad-${s.pair.exchangeId}-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={s.originX}
                  y1={s.originY}
                  x2={HARBOR_X}
                  y2={HARBOR_Y}
                >
                  <stop offset="0%" stopColor={DEX_BUY_COLOR} />
                  <stop offset={`${Math.max(0, s.buyRatio * 100 - 3)}%`} stopColor={DEX_BUY_COLOR} />
                  <stop offset={`${Math.min(100, s.buyRatio * 100 + 3)}%`} stopColor={DEX_SELL_COLOR} />
                  <stop offset="100%" stopColor={DEX_SELL_COLOR} />
                </linearGradient>
              ) : null,
            )}
          </defs>

          <rect width={WIDTH} height={HEIGHT} fill="url(#stream-canvas-bg)" />

          {streams.map((s, i) => {
            const strokeId = `stream-grad-${s.pair.exchangeId}-${i}`;
            const stroke = s.pair.source === "dex" && s.buyRatio !== null ? `url(#${strokeId})` : CEX_COLOR;
            return (
              <g
                key={`${s.pair.source}-${s.pair.exchangeId}-${i}`}
                style={{
                  animation: `stream-bob ${s.bobDurationS}s ease-in-out infinite`,
                  animationDelay: `${s.bobDelayS}s`,
                }}
              >
                {/* Wider transparent hit path — the visible stroke is too thin to hover precisely. */}
                <path
                  d={s.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(s.width, 18)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(s.pair)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setPointer({
                      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
                      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
                <path
                  d={s.path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeDasharray="4 8"
                  style={{ animation: `stream-flow ${s.flowDurationS}s linear infinite`, pointerEvents: "none" }}
                  opacity={hovered && hovered !== s.pair ? 0.35 : 0.9}
                />
                {/* Single line, shorter than before — full buy/sell detail lives in the hover tooltip, not stacked here. */}
                <text
                  x={s.originX + 10}
                  y={s.originY - s.width / 2 - 8}
                  className="fill-white"
                  style={{ fontSize: 10.5, fontWeight: 600 }}
                  {...TEXT_HALO}
                >
                  {s.pair.label}{" "}
                  <tspan className="fill-white/70" style={{ fontWeight: 400 }}>
                    · {formatUsd(s.pair.volumeUsd24h)}
                  </tspan>
                </text>
              </g>
            );
          })}

          <circle cx={HARBOR_X} cy={HARBOR_Y} r={HARBOR_RADIUS} fill="url(#stream-harbor)" stroke="#0a3aa0" strokeOpacity={0.6} />
          <text
            x={HARBOR_X}
            y={HARBOR_Y - 2}
            textAnchor="middle"
            className="fill-white"
            style={{ fontSize: 11, fontWeight: 700 }}
            {...TEXT_HALO}
          >
            {symbol ?? "?"}
          </text>
          <text
            x={HARBOR_X}
            y={HARBOR_Y + 11}
            textAnchor="middle"
            className="fill-white/80"
            style={{ fontSize: 8 }}
            {...TEXT_HALO}
          >
            {formatUsd(totalVolumeUsd24h)}
          </text>
        </svg>

        {hovered && pointer && (
          <div
            className="xp-glass pointer-events-none absolute z-10 max-w-64 rounded-md px-3 py-2 text-xs shadow-lg"
            style={{ left: (pointer.x / WIDTH) * 100 + "%", top: (pointer.y / HEIGHT) * 100 + "%" }}
          >
            <p className="font-medium text-foreground">{hovered.label}</p>
            <p className="text-muted-foreground">{formatUsd(hovered.volumeUsd24h)} · 24h volume</p>
            {hovered.source === "dex" ? (
              hovered.buyTxns24h !== null && hovered.sellTxns24h !== null ? (
                <p className="text-muted-foreground">
                  {formatCompactNumber(hovered.buyTxns24h)} buys / {formatCompactNumber(hovered.sellTxns24h)} sells
                </p>
              ) : (
                <p className="text-muted-foreground">Transaction counts unavailable</p>
              )
            ) : (
              <p className="text-muted-foreground">Buy/sell split not available for centralized exchanges</p>
            )}
            {hovered.pairUrl && <p className="mt-1 text-[10px] text-primary underline">View on {hovered.label}</p>}
          </div>
        )}
      </div>

      {/*
        Normal document flow, not an overlay on top of the canvas: the
        legend used to sit absolutely-positioned over the SVG, but at the
        render scale a real page uses, its fixed screen-pixel footprint ate
        into the SVG's own coordinate space right where the bottom-most
        stream's label lands — the two would collide regardless of how much
        marginY the streams reserved. Living below the canvas instead makes
        that collision structurally impossible.
      */}
      <div className="flex flex-wrap items-center gap-2.5 bg-[#041a42] px-2.5 py-1.5 text-[10px] text-white/90">
        <span className="font-medium tracking-wide uppercase">Width = 24h volume</span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: DEX_BUY_COLOR }} />
          Buy txns
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: DEX_SELL_COLOR }} />
          Sell txns
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: CEX_COLOR }} />
          CEX (volume only)
        </span>
      </div>
    </div>
  );
}
