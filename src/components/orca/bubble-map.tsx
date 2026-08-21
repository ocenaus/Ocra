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
}

const WIDTH = 720;
const HEIGHT = 480;

export function BubbleMap({ holders, symbol }: { holders: HolderEntry[]; symbol: string | null }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hovered, setHovered] = useState<BubbleNode | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || holders.length === 0) return;

    const radii = computeBubbleRadii(holders.map((h) => h.percentageOfSupply));
    const nodes: BubbleNode[] = holders.map((holder, i) => ({
      id: holder.address,
      holder,
      radius: radii[i],
      x: WIDTH / 2 + (Math.random() - 0.5) * 40,
      y: HEIGHT / 2 + (Math.random() - 0.5) * 40,
    }));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    const gradient = defs
      .append("radialGradient")
      .attr("id", "bubble-glow")
      .attr("cx", "35%")
      .attr("cy", "35%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--color-primary)").attr("stop-opacity", 0.9);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--color-primary)").attr("stop-opacity", 0.25);

    const circles = svg
      .selectAll<SVGCircleElement, BubbleNode>("circle")
      .data(nodes, (d) => d.id)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", "url(#bubble-glow)")
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1)
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
  }, [holders]);

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
        </div>
      )}
    </div>
  );
}
