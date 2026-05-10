import { useState, useMemo, useCallback } from "react";
import { TACTIC_ORDER, TACTIC_SHORT, TACTIC_CLR } from "../constants.js";

const STORAGE_KEY = "attack_defense_gap_v1";
const STATES = ["none", "partial", "covered"];
const STATE_CLR = { none: "#ef4444", partial: "#f59e0b", covered: "#22c55e" };
const STATE_LABEL = { none: "未対応", partial: "一部対応", covered: "対応済" };

function loadCoverage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export default function DefenseGapMap({ groups, techniques }) {
  const [coverage, setCoverage] = useState(loadCoverage);
  const [filterState, setFilterState] = useState("all");

  const persist = useCallback(cov => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cov));
    setCoverage(cov);
  }, []);

  const cycleState = useCallback(techId => {
    const cur = coverage[techId] || "none";
    const next = STATES[(STATES.indexOf(cur) + 1) % STATES.length];
    persist({ ...coverage, [techId]: next });
  }, [coverage, persist]);

  // Group techniques by tactic
  const byTactic = useMemo(() => {
    const map = {};
    TACTIC_ORDER.forEach(t => { map[t] = []; });
    for (const tech of techniques) {
      for (const tactic of tech.tactics || []) {
        if (map[tactic]) map[tactic].push(tech);
      }
    }
    return map;
  }, [techniques]);

  const usedTactics = TACTIC_ORDER.filter(t => byTactic[t]?.length > 0);

  const setTacticState = useCallback((tactic, state) => {
    const ids = byTactic[tactic]?.map(t => t.id) || [];
    const updated = { ...coverage };
    ids.forEach(id => { updated[id] = state; });
    persist(updated);
  }, [coverage, persist, byTactic]);

  // Danger ranking: groups with most uncovered techniques
  const dangerGroups = useMemo(() => {
    return groups.map(g => {
      const techIds = new Set(g.techniques.map(t => t.id));
      const uncovered = g.techniques.filter(t => (coverage[t.id] || "none") === "none");
      const partial = g.techniques.filter(t => (coverage[t.id] || "none") === "partial");
      return {
        ...g,
        uncoveredCount: uncovered.length,
        partialCount: partial.length,
        totalCount: g.techniques.length,
        dangerScore: uncovered.length * 2 + partial.length,
      };
    }).sort((a, b) => b.dangerScore - a.dangerScore);
  }, [groups, coverage]);

  // Stats
  const total = techniques.length;
  const coveredCount = techniques.filter(t => (coverage[t.id] || "none") === "covered").length;
  const partialCount = techniques.filter(t => (coverage[t.id] || "none") === "partial").length;
  const noneCount = total - coveredCount - partialCount;

  const exportCsv = () => {
    const rows = [["Technique ID", "Technique Name", "Tactics", "Status"]];
    for (const tech of techniques) {
      rows.push([tech.id, tech.name, tech.tactics.join("|"), coverage[tech.id] || "none"]);
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `defense_gap_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const filteredByState = t => filterState === "all" || (coverage[t.id] || "none") === filterState;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#070c12" }}>
      {/* Header controls */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e2d3d", background: "#0d1117", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 9, color: "#3d5168", letterSpacing: 2 }}>テクニックをクリックで検知ステータスを切り替え</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(STATE_CLR).map(([s, c]) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c + "44", border: `1px solid ${c}` }} />
                  <span style={{ color: "#6b7280" }}>{STATE_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[["all","全て"],["none","未対応"],["partial","一部"],["covered","対応済"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterState(val)}
                  style={{ background: filterState === val ? "#1e2d3d" : "transparent", border: "1px solid #1e2d3d", borderRadius: 3, padding: "3px 8px", color: filterState === val ? "#c9d1d9" : "#4a6378", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={exportCsv}
              style={{ background: "#0a0d1a", border: "1px solid #3b82f6", borderRadius: 4, padding: "4px 12px", color: "#3b82f6", fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>
              ⬇ CSV エクスポート
            </button>
          </div>
        </div>
        {/* Coverage summary */}
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11 }}>
          <span style={{ color: "#22c55e" }}>対応済: {coveredCount}</span>
          <span style={{ color: "#f59e0b" }}>一部: {partialCount}</span>
          <span style={{ color: "#ef4444" }}>未対応: {noneCount}</span>
          <span style={{ color: "#3d5168" }}>合計: {total}</span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ flex: 1, height: 6, background: "#1e2d3d", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", display: "flex" }}>
                <div style={{ width: `${(coveredCount/total)*100}%`, background: "#22c55e" }} />
                <div style={{ width: `${(partialCount/total)*100}%`, background: "#f59e0b" }} />
              </div>
            </div>
            <span style={{ color: "#6b7280", fontSize: 10 }}>{Math.round((coveredCount/total)*100)}%</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Heatmap */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 6, minWidth: "max-content" }}>
            {usedTactics.map(tactic => {
              const techs = byTactic[tactic].filter(filteredByState);
              if (!techs.length && filterState !== "all") return null;
              const all = byTactic[tactic];
              return (
                <div key={tactic} style={{ minWidth: 110 }}>
                  <div style={{ background: TACTIC_CLR[tactic] + "22", border: `1px solid ${TACTIC_CLR[tactic]}55`, borderRadius: "4px 4px 0 0", padding: "4px 5px", marginBottom: 4 }}>
                    <div style={{ color: TACTIC_CLR[tactic], fontSize: 8, fontWeight: "bold", letterSpacing: 1, textAlign: "center" }}>{TACTIC_SHORT[tactic]}</div>
                    <div style={{ color: "#3d5168", fontSize: 8, textAlign: "center", marginBottom: 3 }}>
                      {all.filter(t => (coverage[t.id]||"none") === "covered").length}/{all.length}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[["none","未対応"],["partial","一部"],["covered","対応済"]].map(([s, label]) => {
                        const clr = STATE_CLR[s];
                        return (
                          <button key={s} onClick={() => setTacticState(tactic, s)}
                            style={{ flex: 1, background: clr + "33", border: `1px solid ${clr}`, borderRadius: 2, padding: "1px 0", color: clr, fontSize: 7, cursor: "pointer", fontFamily: "monospace", lineHeight: 1.4, transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = clr; e.currentTarget.style.color = "#070c12"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = clr + "33"; e.currentTarget.style.color = clr; }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {(filterState === "all" ? all : techs).map(tech => {
                      const state = coverage[tech.id] || "none";
                      const clr = STATE_CLR[state];
                      return (
                        <div key={tech.id}
                          onClick={() => cycleState(tech.id)}
                          title={`${tech.id}: ${tech.name}\n状態: ${STATE_LABEL[state]}\nクリックで切替`}
                          style={{ background: clr + "22", border: `1px solid ${clr}88`, borderRadius: 3, padding: "3px 5px", cursor: "pointer", transition: "background 0.15s, border-color 0.15s, transform 0.1s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = clr + "55"; e.currentTarget.style.borderColor = clr; e.currentTarget.style.transform = "scale(1.03)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = clr + "22"; e.currentTarget.style.borderColor = clr + "88"; e.currentTarget.style.transform = "scale(1)"; }}>
                          <div style={{ color: clr, fontSize: 8, fontWeight: "bold" }}>{tech.id}</div>
                          <div style={{ color: "#8b949e", fontSize: 8, lineHeight: 1.2 }}>
                            {tech.name.length > 18 ? tech.name.slice(0, 17) + "…" : tech.name}
                          </div>
                          <div style={{ width: "100%", height: 2, background: "#1e2d3d", borderRadius: 1, marginTop: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: state === "covered" ? "100%" : state === "partial" ? "50%" : "0%", background: clr, transition: "width 0.2s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger panel */}
        <div style={{ width: 260, borderLeft: "1px solid #1e2d3d", background: "#0d1117", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e2d3d", color: "#3d5168", fontSize: 9, letterSpacing: 2 }}>
            危険度ランキング（未対応テクニック保有グループ）
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {dangerGroups.filter(g => g.uncoveredCount > 0).slice(0, 15).map((g, i) => (
              <div key={g.id} style={{ background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 4, padding: "8px 10px", marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8b949e", fontSize: 11 }}>{g.country?.flag} {g.name}</span>
                  <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: 12 }}>{g.uncoveredCount}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#3d5168", marginTop: 3 }}>
                  <span style={{ color: "#f59e0b" }}>一部: {g.partialCount}</span>
                  <span>/{g.totalCount} techs</span>
                </div>
                <div style={{ height: 3, background: "#1e2d3d", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    display: "flex",
                  }}>
                    <div style={{ width: `${(g.uncoveredCount / g.totalCount) * 100}%`, background: "#ef4444" }} />
                    <div style={{ width: `${(g.partialCount / g.totalCount) * 100}%`, background: "#f59e0b" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
