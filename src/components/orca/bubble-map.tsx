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

    const canvasGradient = defs.append("radialGradient").attr("id", "bubble-canvas-bg").attr("cx", "50%").attr("cy", "35%");
    canvasGradient.append("stop").attr("offset", "0%").attr("stop-color", "#123a7a");
    canvasGradient.append("stop").attr("offset", "100%").attr("stop-color", "#041a42");
    svg.append("rect").attr("width", WIDTH).attr("height", HEIGHT).attr("fill", "url(#bubble-canvas-bg)");

    // Glossy glass-sphere look: a deep-to-light body gradient (bottom-right
    // shadow, top-left light) plus a separate small specular highlight
    // ellipse per bubble gives the 3D "orb" effect without any image assets.
    const bodyGradient = defs.append("radialGradient").attr("id", "bubble-body").attr("cx", "38%").attr("cy", "32%");
    bodyGradient.append("stop").attr("offset", "0%").attr("stop-color", "#bfe0ff");
    bodyGradient.append("stop").attr("offset", "45%").attr("stop-color", "#4fa3f7");
    bodyGradient.append("stop").attr("offset", "85%").attr("stop-color", "#1457d6");
    bodyGradient.append("stop").attr("offset", "100%").attr("stop-color", "#0a3aa0");

    const creatorBodyGradient = defs
      .append("radialGradient")
      .attr("id", "bubble-body-creator")
      .attr("cx", "38%")
      .attr("cy", "32%");
    creatorBodyGradient.append("stop").attr("offset", "0%").attr("stop-color", "#fff2c7");
    creatorBodyGradient.append("stop").attr("offset", "45%").attr("stop-color", "#f7c34f");
    creatorBodyGradient.append("stop").attr("offset", "85%").attr("stop-color", "#d68a10");
    creatorBodyGradient.append("stop").attr("offset", "100%").attr("stop-color", "#8a5406");

    const shineGradient = defs.append("radialGradient").attr("id", "bubble-shine").attr("cx", "50%").attr("cy", "50%");
    shineGradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffffff").attr("stop-opacity", 0.95);
    shineGradient.append("stop").attr("offset", "70%").attr("stop-color", "#ffffff").attr("stop-opacity", 0.25);
    shineGradient.append("stop").attr("offset", "100%").attr("stop-color", "#ffffff").attr("stop-opacity", 0);

    const dropShadow = defs.append("filter").attr("id", "bubble-drop-shadow").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    dropShadow.append("feDropShadow").attr("dx", 0).attr("dy", 2).attr("stdDeviation", 2.5).attr("flood-color", "#0a3aa0").attr("flood-opacity", 0.35);

    const bubbleGroups = svg
      .selectAll<SVGGElement, BubbleNode>("g.bubble")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("class", "bubble")
      .style("cursor", "pointer")
      .on("mouseenter", (_event, d) => setHovered(d))
      .on("mousemove", (event) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      })
      .on("mouseleave", () => setHovered(null));

    bubbleGroups
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => (d.isCreator ? "url(#bubble-body-creator)" : "url(#bubble-body)"))
      .attr("stroke", (d) => (d.isCreator ? "#8a5406" : "#0a3aa0"))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => (d.isCreator ? 2 : 1))
      .attr("filter", "url(#bubble-drop-shadow)");

    bubbleGroups
      .append("ellipse")
      .attr("rx", (d) => d.radius * 0.34)
      .attr("ry", (d) => d.radius * 0.22)
      .attr("transform", (d) => `translate(${-d.radius * 0.32} ${-d.radius * 0.38}) rotate(-25)`)
      .attr("fill", "url(#bubble-shine)")
      .style("pointer-events", "none");

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
        bubbleGroups.attr("transform", (d) => `translate(${d.x ?? WIDTH / 2} ${d.y ?? HEIGHT / 2})`);
      });

    return () => {
      simulation.stop();
    };
  }, [holders, creatorAddress]);

  if (holders.length === 0) {
    return null;
  }

  const knownPercentages = holders.map((h) => h.percentageOfSupply).filter((p): p is number => p !== null);
  const minPct = knownPercentages.length > 0 ? Math.min(...knownPercentages) : null;
  const maxPct = knownPercentages.length > 0 ? Math.max(...knownPercentages) : null;

  return (
    <div className="relative overflow-hidden rounded-md border border-[#0a3aa0]/40">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full"
        style={{ maxHeight: HEIGHT }}
        role="img"
        aria-label="Token holder ocean map"
      />

      {minPct !== null && maxPct !== null && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-[4px] bg-[#04174080] px-2.5 py-1.5 text-[10px] text-white/90 backdrop-blur-sm">
          <span className="font-medium tracking-wide uppercase">Bubble = % of supply</span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#4fa3f7]" />
            {formatPercentage(minPct)}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-full bg-[#4fa3f7]" />
            {formatPercentage(maxPct)}
          </span>
        </div>
      )}

      {hovered && pointer && (
        <div
          className="xp-glass pointer-events-none absolute z-10 max-w-56 rounded-md px-3 py-2 text-xs shadow-lg"
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
