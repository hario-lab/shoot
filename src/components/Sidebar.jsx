import { COUNTRY_META } from "../constants.js";

export default function Sidebar({ groups, selId, onSelect, search, onSearch, countryFilter, onCountryFilter }) {
  const avg = groups.length ? Math.round(groups.reduce((s, g) => s + g.techniques.length, 0) / groups.length) : 0;

  const filtered = groups.filter(g => {
    const ms = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search.toUpperCase());
    const mc = countryFilter === "ALL" || g.country?.code === countryFilter;
    return ms && mc;
  });

  return (
    <div style={{ width: 230, background: "#0d1117", borderRight: "1px solid #1e2d3d", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid #1e2d3d" }}>
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

      <div style={{ padding: "8px 10px", borderBottom: "1px solid #1e2d3d" }}>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="// search..."
          style={{ width: "100%", background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 4, padding: "5px 9px", color: "#8b949e", fontSize: 11, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
      </div>

      <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e2d3d", color: "#3d5168", fontSize: 10 }}>
        {filtered.length} group{filtered.length !== 1 ? "s" : ""}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map(g => (
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
