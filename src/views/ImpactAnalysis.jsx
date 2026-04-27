import { useState, useMemo } from "react";
import { PLATFORM_GROUPS, COUNTRY_META, TACTIC_ORDER } from "../constants.js";

export default function ImpactAnalysis({ groups, onSelectGroup, onSwitchToKillChain }) {
  const [selPlatforms, setSelPlatforms] = useState(["Windows"]);

  const togglePlatform = p => {
    setSelPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  // Expand selected platform group names to actual platform strings
  const activePlatforms = useMemo(() => {
    const set = new Set();
    for (const p of selPlatforms) {
      for (const actual of PLATFORM_GROUPS[p] || [p]) set.add(actual);
    }
    return set;
  }, [selPlatforms]);

  const ranked = useMemo(() => {
    if (!selPlatforms.length) return [];
    return groups.map(g => {
      const matching = g.techniques.filter(t =>
        t.platforms?.some(p => activePlatforms.has(p))
      );
      const tacticSet = new Set(matching.flatMap(t => t.tactics));
      const techCount = matching.length;
      const tacticCoverage = tacticSet.size;
      const riskScore = Math.round(techCount * (tacticCoverage / 14) * 10) / 10;
      const tacticPhases = TACTIC_ORDER.filter(t => tacticSet.has(t));
      return { ...g, matching, techCount, tacticCoverage, riskScore, tacticPhases };
    })
      .filter(g => g.techCount > 0)
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [groups, activePlatforms, selPlatforms]);

  const maxScore = ranked[0]?.riskScore || 1;

  const handleGroupClick = id => {
    onSelectGroup(id);
    onSwitchToKillChain();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#070c12" }}>
      {/* Platform selector */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2d3d", background: "#0d1117", flexShrink: 0 }}>
        <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>
          対象環境を選択 — 選択環境を狙うグループをリスクスコア順にランキング表示
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.keys(PLATFORM_GROUPS).map(p => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={selPlatforms.includes(p)} onChange={() => togglePlatform(p)}
                style={{ accentColor: "#00ff88", width: 13, height: 13 }} />
              <span style={{ color: selPlatforms.includes(p) ? "#00ff88" : "#4a6378", fontSize: 12, fontFamily: "monospace", transition: "color 0.15s" }}>
                {p}
              </span>
            </label>
          ))}
        </div>
        {selPlatforms.length > 0 && (
          <div style={{ marginTop: 8, color: "#3d5168", fontSize: 10 }}>
            プラットフォーム: {[...activePlatforms].join(", ")}
          </div>
        )}
      </div>

      {/* Ranking */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {!selPlatforms.length ? (
          <div style={{ color: "#3d5168", fontSize: 13, textAlign: "center", marginTop: 60 }}>
            対象環境を選択してください
          </div>
        ) : ranked.length === 0 ? (
          <div style={{ color: "#3d5168", fontSize: 13, textAlign: "center", marginTop: 60 }}>
            選択環境に対応するテクニックを持つグループは見つかりませんでした
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ranked.map((g, i) => {
              const barWidth = Math.round((g.riskScore / maxScore) * 100);
              const badgeColor = i < 3 ? "#ef4444" : i < 8 ? "#f59e0b" : "#4a6378";
              const countryColor = COUNTRY_META[g.country?.code]?.color || "#6b7280";
              return (
                <div key={g.id}
                  onClick={() => handleGroupClick(g.id)}
                  style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 6, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#2d4461"; e.currentTarget.style.background = "#0f1923"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2d3d"; e.currentTarget.style.background = "#0d1117"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: badgeColor, fontWeight: "bold", fontSize: 13, minWidth: 20 }}>#{i + 1}</span>
                      <span style={{ fontSize: 14 }}>{g.country?.flag}</span>
                      <span style={{ color: "#c9d1d9", fontWeight: "bold", fontSize: 13 }}>{g.name}</span>
                      <span style={{ color: "#3d5168", fontSize: 11 }}>{g.id}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: badgeColor, fontSize: 18, fontWeight: "bold", lineHeight: 1 }}>{g.riskScore}</div>
                        <div style={{ color: "#3d5168", fontSize: 9 }}>RISK SCORE</div>
                      </div>
                    </div>
                  </div>

                  {/* Risk bar */}
                  <div style={{ height: 4, background: "#1e2d3d", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barWidth}%`, background: badgeColor, borderRadius: 2, transition: "width 0.4s" }} />
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#4a6378", marginBottom: 8 }}>
                    <span>テクニック: <span style={{ color: "#00ff88" }}>{g.techCount}</span></span>
                    <span>戦術カバレッジ: <span style={{ color: "#00d4ff" }}>{g.tacticCoverage}/14</span></span>
                    <span>スコア = {g.techCount} × {g.tacticCoverage}/14</span>
                  </div>

                  {/* Tactic phases covered */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {g.tacticPhases.map(t => (
                      <span key={t} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, background: "#1e2d3d", color: "#6b7280" }}>
                        {t.replace(/-/g, " ").toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div style={{ padding: "8px 20px", borderTop: "1px solid #1e2d3d", background: "#0d1117", flexShrink: 0, color: "#3d5168", fontSize: 10 }}>
        リスクスコア = テクニック数 × (戦術カバレッジ / 14) · グループをクリックでKILL CHAINビューに遷移
      </div>
    </div>
  );
}
