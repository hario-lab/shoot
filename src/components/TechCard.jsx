import { useState } from "react";
import { TACTIC_CLR } from "../constants.js";

export default function TechCard({ tech, tactic, isSelected, onClick, selSub, onSubClick }) {
  const [expanded, setExpanded] = useState(false);
  const clr = TACTIC_CLR[tactic] || "#4a6378";
  const hasSubs = tech.subs?.length > 0;

  return (
    <div>
      <div
        onClick={onClick}
        style={{
          background: isSelected ? `${clr}22` : "#0d1117",
          border: `1px solid ${isSelected ? clr : "#1e2d3d"}`,
          borderRadius: 4,
          padding: "5px 7px",
          cursor: "pointer",
          transition: "all 0.1s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#00d4ff", fontSize: 9, fontWeight: "bold" }}>{tech.id}</div>
            <div style={{ color: isSelected ? "#c9d1d9" : "#8b949e", fontSize: 10, lineHeight: 1.3, marginTop: 1, wordBreak: "break-word" }}>
              {tech.name}
            </div>
          </div>
          {hasSubs && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
              style={{ background: "none", border: "none", color: clr, cursor: "pointer", fontSize: 10, padding: "0 2px", flexShrink: 0 }}
              title="サブテクニックを展開"
            >
              {expanded ? "▲" : "▼"} {tech.subs.length}
            </button>
          )}
        </div>
      </div>
      {expanded && hasSubs && (
        <div style={{ marginLeft: 6, marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {tech.subs.map(sub => (
            <div
              key={sub.id}
              onClick={() => onSubClick(sub)}
              style={{
                background: selSub?.id === sub.id ? `${clr}22` : "#070c12",
                border: `1px solid ${selSub?.id === sub.id ? clr : "#1e2d3d55"}`,
                borderRadius: 3,
                padding: "4px 6px",
                cursor: "pointer",
                borderLeft: `3px solid ${clr}66`,
              }}
            >
              <div style={{ color: "#a855f7", fontSize: 9, fontWeight: "bold" }}>{sub.id}</div>
              <div style={{ color: "#6b7280", fontSize: 9, marginTop: 1 }}>{sub.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
