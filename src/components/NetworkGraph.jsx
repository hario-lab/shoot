import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { COUNTRY_META } from "../constants.js";

export default function NetworkGraph({ groups, links, onSelectGroup, selId, countryFilter }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !groups.length) return;

    const W = el.clientWidth || 800;
    const H = el.clientHeight || 500;
    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const visGroups = countryFilter === "ALL" ? groups : groups.filter(g => g.country.code === countryFilter);
    const visIds = new Set(visGroups.map(g => g.id));
    const visLinks = links.filter(l => visIds.has(l.source) && visIds.has(l.target) && l.value >= 7);

    const nodes = visGroups.map(g => ({ ...g }));
    const edges = visLinks.map(l => ({ ...l }));

    const zoom = d3.zoom().scaleExtent([0.2, 4]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom);

    const g = svg.append("g");

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(d => Math.max(60, 160 - d.value * 3)).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(28));

    const maxVal = d3.max(edges, d => d.value) || 1;
    const widthScale = d3.scaleLinear().domain([5, maxVal]).range([0.5, 4]);

    const link = g.append("g").selectAll("line").data(edges).enter().append("line")
      .attr("stroke", "#1e2d3d")
      .attr("stroke-width", d => widthScale(d.value))
      .attr("stroke-opacity", 0.7);

    const node = g.append("g").selectAll("g").data(nodes).enter().append("g")
      .attr("cursor", "pointer")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end",   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on("click", (_, d) => onSelectGroup(d.id));

    node.append("circle")
      .attr("r", d => 8 + (d.techniques?.length || 0) / 6)
      .attr("fill", d => (COUNTRY_META[d.country?.code]?.color || "#6b7280") + "44")
      .attr("stroke", d => d.id === selId ? "#00ff88" : (COUNTRY_META[d.country?.code]?.color || "#6b7280"))
      .attr("stroke-width", d => d.id === selId ? 2.5 : 1.5);

    node.append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("font-family", "monospace")
      .attr("fill", d => d.id === selId ? "#00ff88" : "#8b949e")
      .attr("pointer-events", "none")
      .text(d => d.name.length > 12 ? d.name.slice(0, 11) + "…" : d.name)
      .attr("y", d => -(10 + (d.techniques?.length || 0) / 6));

    sim.on("tick", () => {
      link
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [groups, links, selId, countryFilter]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}
