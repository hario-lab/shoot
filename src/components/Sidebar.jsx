import { useState } from "react";
import { COUNTRY_META } from "../constants.js";

const SORT_MODES = ["alpha", "ttp", "country"];
const SORT_LABELS = { alpha: "A→Z", ttp: "TTP数", country: "国別" };

export default function Sidebar({ groups, selId, onSelect, search, onSearch, countryFilter, onCountryFilter }) {
  const [sortMode, setSortMode] = useState("alpha");

  const avg = groups.length ? Math.round(groups.reduce((s, g) => s + g.techniques.length, 0) / groups.length) : 0;

  const filtered = groups.filter(g => {
    const ms = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search.toUpperCase());
    const mc = countryFilter === "ALL" || g.country?.code === countryFilter;
    return ms && mc;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "ttp") return b.techniques.length - a.techniques.length;
    if (sortMode === "country") {
      const ca = a.country?.code || "ZZZ";
      const cb = b.country?.code || "ZZZ";
      return ca !== cb ? ca.localeCompare(cb) : a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{ width: 230, height: "100vh", background: "#0d1117", borderRight: "1px solid #1e2d3d", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
      <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid #1e2d3d", flexShrink: 0 }}>
        <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>FILTER BY ORIGIN</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {[["ALL", "🌐", "#00ff88"], ...Object.entries(COUNTRY_META).map(([c, m]) => [c, m.flag, m.color])].map(([code, flag, color]) => (
            <button key={code} onClick={() => onCountryFilter(code)}
              style={{ background: countryFilter === code ? color + "33" : "transparent", border: `1px solid ${countryFilter === code ? color : "#1e2d3d"}`, borderRadius: 3, padding: "3px 7px", cursor: "pointer", fontSize: 11, color: countryFilter === code ? color : "#4a6378", fontFamily: "monospace", transition: "all 0.15s" }}>
              {flag} {code}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 10px", borderBottom: "1px solid #1e2d3d", flexShrink: 0 }}>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="// search..."
          style={{ width: "100%", background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 4, padding: "5px 9px", color: "#8b949e", fontSize: 11, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
      </div>

      <div style={{ padding: "5px 10px", borderBottom: "1px solid #1e2d3d", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ color: "#3d5168", fontSize: 10, flexShrink: 0 }}>{sorted.length} groups</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
          {SORT_MODES.map(mode => (
            <button key={mode} onClick={() => setSortMode(mode)}
              style={{ background: sortMode === mode ? "#00d4ff22" : "transparent", border: `1px solid ${sortMode === mode ? "#00d4ff" : "#1e2d3d"}`, borderRadius: 3, padding: "2px 6px", cursor: "pointer", fontSize: 9, color: sortMode === mode ? "#00d4ff" : "#4a6378", fontFamily: "monospace", transition: "all 0.15s" }}>
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {sorted.map(g => (
          <div key={g.id} onClick={() => onSelect(g.id)}
            style={{ padding: "7px 12px", cursor: "pointer", borderLeft: `2px solid ${g.id === selId ? "#00ff88" : "transparent"}`, background: g.id === selId ? "#001a0d" : "transparent", transition: "all 0.1s" }}
            onMouseEnter={e => { if (g.id !== selId) e.currentTarget.style.background = "#0f1923"; }}
            onMouseLeave={e => { if (g.id !== selId) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: "bold", color: g.id === selId ? "#00ff88" : "#8b949e" }}>
                {g.country?.flag} {g.name}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#3d5168", marginTop: 1, display: "flex", gap: 8 }}>
              <span>{g.id}</span>
              <span style={{ color: g.techniques.length > avg ? "#00ff88" : "#4a6378" }}>{g.techniques.length} techs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
