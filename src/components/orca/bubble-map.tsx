"use client";

import { useEffect, useRef, useState } from "react";
import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { select } from "d3-selection";
import type { HolderEntry } from "@/lib/services/types";
import { computeBubbleRadii } from "@/lib/services/token/math";
import { formatPercentage, shortenAddress } from "@/lib/format";

interface BubbleNode extends SimulationNodeDatum {
  id: string;
  holder: HolderEntry;
  radius: number;
  isCreator: boolean;
}

const WIDTH = 720;
const HEIGHT = 480;

export function BubbleMap({
  holders,
  symbol,
  creatorAddress,
}: {
  holders: HolderEntry[];
  symbol: string | null;
  /** From Etherscan's contract creation record — highlighted only if it's among the current top holders. Never guessed. */
  creatorAddress?: string | null;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hovered, setHovered] = useState<BubbleNode | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || holders.length === 0) return;

    const normalizedCreator = creatorAddress?.toLowerCase() ?? null;
    const radii = computeBubbleRadii(holders.map((h) => h.percentageOfSupply));
    const nodes: BubbleNode[] = holders.map((holder, i) => ({
      id: holder.address,
      holder,
      radius: radii[i],
      isCreator: normalizedCreator !== null && holder.address.toLowerCase() === normalizedCreator,
      x: WIDTH / 2 + (Math.random() - 0.5) * 40,
      y: HEIGHT / 2 + (Math.random() - 0.5) * 40,
    }));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    const glowGradient = defs.append("radialGradient").attr("id", "bubble-glow").attr("cx", "35%").attr("cy", "35%");
    glowGradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--color-primary)").attr("stop-opacity", 0.9);
    glowGradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--color-primary)").attr("stop-opacity", 0.25);

    const creatorGradient = defs
      .append("radialGradient")
      .attr("id", "bubble-glow-creator")
      .attr("cx", "35%")
      .attr("cy", "35%");
    creatorGradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--color-warning)").attr("stop-opacity", 0.9);
    creatorGradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--color-warning)").attr("stop-opacity", 0.3);

    const circles = svg
      .selectAll<SVGCircleElement, BubbleNode>("circle")
      .data(nodes, (d) => d.id)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => (d.isCreator ? "url(#bubble-glow-creator)" : "url(#bubble-glow)"))
      .attr("stroke", (d) => (d.isCreator ? "var(--color-warning)" : "var(--color-primary)"))
      .attr("stroke-opacity", (d) => (d.isCreator ? 0.9 : 0.5))
      .attr("stroke-width", (d) => (d.isCreator ? 2 : 1))
      .style("cursor", "pointer")
      .on("mouseenter", (_event, d) => setHovered(d))
      .on("mousemove", (event) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      })
      .on("mouseleave", () => setHovered(null));

    const simulation = forceSimulation(nodes)
      .force("x", forceX(WIDTH / 2).strength(0.04))
      .force("y", forceY(HEIGHT / 2).strength(0.04))
      .force(
        "collide",
        forceCollide<BubbleNode>()
          .radius((d) => d.radius + 2)
          .iterations(3),
      )
      .on("tick", () => {
        circles.attr("cx", (d) => d.x ?? WIDTH / 2).attr("cy", (d) => d.y ?? HEIGHT / 2);
      });

    return () => {
      simulation.stop();
    };
  }, [holders, creatorAddress]);

  if (holders.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full rounded-lg"
        style={{ maxHeight: HEIGHT }}
        role="img"
        aria-label="Token holder bubble map"
      />
      {hovered && pointer && (
        <div
          className="glass-panel pointer-events-none absolute z-10 max-w-56 rounded-md px-3 py-2 text-xs shadow-lg"
          style={{ left: pointer.x + 12, top: pointer.y + 12 }}
        >
          <p className="font-mono text-foreground">{shortenAddress(hovered.holder.address)}</p>
          <p className="text-muted-foreground">
            {formatPercentage(hovered.holder.percentageOfSupply)} of supply
            {symbol ? ` · ${symbol}` : ""}
          </p>
          {hovered.isCreator && <p className="mt-1 font-medium text-warning">Contract creator</p>}
        </div>
      )}
    </div>
  );
}
