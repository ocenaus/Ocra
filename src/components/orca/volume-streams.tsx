"use client";

import { useMemo, useState } from "react";
import type { PairVolume } from "@/lib/services/types";
import { computeStreamWidths } from "@/lib/services/token/math";
import { formatCompactNumber, formatUsd } from "@/lib/format";

const WIDTH = 720;
const HEIGHT = 440;
const HARBOR_X = WIDTH * 0.82;
const HARBOR_Y = HEIGHT / 2;
const HARBOR_RADIUS = 34;

const DEX_BUY_COLOR = "#199e70";
const DEX_SELL_COLOR = "#e66767";
const CEX_COLOR = "#3987e5";

interface StreamLayout {
  pair: PairVolume;
  path: string;
  width: number;
  originX: number;
  originY: number;
  buyRatio: number | null;
}

function buildPath(originX: number, originY: number): string {
  const c1x = originX + (HARBOR_X - originX) * 0.55;
  const c2x = originX + (HARBOR_X - originX) * 0.85;
  return `M ${originX} ${originY} C ${c1x} ${originY}, ${c2x} ${HARBOR_Y}, ${HARBOR_X - HARBOR_RADIUS - 4} ${HARBOR_Y}`;
}

export function VolumeStreams({ pairs, symbol }: { pairs: PairVolume[]; symbol: string | null }) {
  const [hovered, setHovered] = useState<PairVolume | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const { streams, totalVolumeUsd24h } = useMemo(() => {
    const widths = computeStreamWidths(pairs.map((p) => p.volumeUsd24h));
    const marginY = 28;
    const usableHeight = HEIGHT - marginY * 2;
    const step = pairs.length > 1 ? usableHeight / (pairs.length - 1) : 0;

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
      };
    });

    return {
      streams: layouts,
      totalVolumeUsd24h: pairs.reduce((sum, p) => sum + p.volumeUsd24h, 0),
    };
  }, [pairs]);

  if (pairs.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-md border border-[#0a3aa0]/40">
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
          {streams.map((s) =>
            s.pair.source === "dex" && s.buyRatio !== null ? (
              <linearGradient
                key={`grad-${s.pair.exchangeId}-${s.pair.label}`}
                id={`stream-grad-${s.pair.exchangeId}-${streams.indexOf(s)}`}
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
            <g key={`${s.pair.source}-${s.pair.exchangeId}-${i}`}>
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
                style={{ animation: "stream-flow 1.6s linear infinite", pointerEvents: "none" }}
                opacity={hovered && hovered !== s.pair ? 0.35 : 0.9}
              />
              <text
                x={s.originX + 10}
                y={s.originY - s.width / 2 - 6}
                className="fill-white/85"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {s.pair.label}
              </text>
              <text x={s.originX + 10} y={s.originY - s.width / 2 + 7} className="fill-white/60" style={{ fontSize: 9 }}>
                {formatUsd(s.pair.volumeUsd24h)}
                {s.buyRatio !== null ? ` · ${Math.round(s.buyRatio * 100)}% buy` : " · CEX"}
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
        >
          {symbol ?? "?"}
        </text>
        <text x={HARBOR_X} y={HARBOR_Y + 11} textAnchor="middle" className="fill-white/80" style={{ fontSize: 8 }}>
          {formatUsd(totalVolumeUsd24h)}
        </text>
      </svg>

      <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2.5 rounded-[4px] bg-[#04174080] px-2.5 py-1.5 text-[10px] text-white/90 backdrop-blur-sm">
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
  );
}
