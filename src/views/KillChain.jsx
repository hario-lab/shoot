import { useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TACTIC_ORDER, TACTIC_SHORT, TACTIC_CLR, TACTIC_INFO, COUNTRY_META } from "../constants.js";
import { callAnthropicAPI, getStoredApiKey } from "../utils/apiClient.js";
import StatCard from "../components/StatCard.jsx";
import TechCard from "../components/TechCard.jsx";

const URL_RE = /https?:\/\/[^\s)>\]]+/g;

function LinkedText({ text }) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={m.index} href={m[0]} target="_blank" rel="noreferrer"
        style={{ color: "#00d4ff", textDecoration: "none" }}
        onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
        onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 4, padding: "6px 10px", fontSize: 11, fontFamily: "monospace" }}>
      <div style={{ color: "#8b949e" }}>{label}: <span style={{ color: "#00ff88" }}>{payload[0].value}</span></div>
    </div>
  );
};

export default function KillChain({ group, groups, onSelectGroup, playClick = () => {}, isNarrow = false }) {
  const [selTech, setSelTech]   = useState(null);
  const [selSub, setSelSub]     = useState(null);
  const [selTactic, setSelTactic] = useState(null);
  const [scenario, setScenario] = useState("");
  const [loading, setLoading]   = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const scrollRef = useRef(null);

  if (!group) return null;

  const byTactic = {};
  TACTIC_ORDER.forEach(t => { byTactic[t] = group.techniques.filter(tech => tech.tactics.includes(t)); });
  const usedTactics = TACTIC_ORDER.filter(t => byTactic[t].length > 0);
  const totalSubs = group.techniques.reduce((s, t) => s + (t.subs?.length || 0), 0);

  const tacticChartData = TACTIC_ORDER
    .map(t => ({ name: TACTIC_SHORT[t], count: byTactic[t].length, color: TACTIC_CLR[t] }))
    .filter(d => d.count > 0);

  const platformCounts = {};
  group.techniques.forEach(t => t.platforms?.forEach(p => { platformCounts[p] = (platformCounts[p] || 0) + 1; }));
  const platformData = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

  const countryDist = Object.entries(
    groups.reduce((acc, g) => { const c = g.country?.code || "UNK"; acc[c] = (acc[c] || 0) + 1; return acc; }, {})
  ).map(([code, count]) => ({ code, count, color: COUNTRY_META[code]?.color || "#6b7280" }));

  const handleTechClick = tech => {
    playClick();
    const isNew = selTech?.id !== tech.id;
    setSelTech(isNew ? tech : null);
    setSelTactic(null);
    setSelSub(null);
    if (isNew) setPanelOpen(true);
  };
  const handleTacticClick = tactic => {
    playClick();
    setSelTactic(tactic);
    setSelTech(null);
    setSelSub(null);
    setPanelOpen(true);
    setScenario("");
  };
  const handleSubClick = sub => { playClick(); setSelSub(selSub?.id === sub.id ? null : sub); };
  const closePanel = () => { setSelTech(null); setSelSub(null); setSelTactic(null); setPanelOpen(false); setScenario(""); };

  const detailItem  = selSub || selTech;
  const detailColor = selTech ? (TACTIC_CLR[selTech.tactics?.[0]] || "#00d4ff") : "#00d4ff";

  const generate = async () => {
    if (!group || loading) return;
    playClick();
    setLoading(true);
    setScenario("");
    const techList = group.techniques.map(t =>
      `${t.id} ${t.name}${t.subs?.length ? ` (subs: ${t.subs.map(s => s.id).join(",")})` : ""} [${t.tactics[0]}]`
    ).join(", ");
    const prompt = `You are a threat intelligence analyst. Write a 3-paragraph attack scenario for "${group.name}" (${group.id}).
Background: ${group.description}
Known TTPs (including subtechniques): ${techList}
Write a cinematic but technically accurate narrative from initial access to impact, referencing specific technique and subtechnique IDs. No preamble.`;
    try {
      const d = await callAnthropicAPI({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] });
      setScenario(d.content?.find(c => c.type === "text")?.text || d.error?.message || "Error");
    } catch (e) {
      setScenario("Error: " + e.message);
    }
    setLoading(false);
  };

  const hasApiKey = !!getStoredApiKey();

  // Side panel on narrow screens: full-width overlay stacked below
  const panelStyle = isNarrow
    ? { width: "100%", borderTop: "1px solid #1e2d3d", background: "#0d1117", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", maxHeight: "45%" }
    : { width: "30%", minWidth: 260, maxWidth: 420, borderLeft: "1px solid #1e2d3d", background: "#0d1117", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Stats row */}
      <div style={{ background: "#070c12", borderBottom: "1px solid #1e2d3d", padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <StatCard label="TECHNIQUES" value={group.techniques.length} sub={`+ ${totalSubs} subs`} color="#00ff88" />
          <StatCard label="TACTICS" value={usedTactics.length} sub={`of ${TACTIC_ORDER.length}`} color="#00d4ff" />
          <StatCard label="ORIGIN" value={group.country?.flag || "?"} sub={group.country?.name || "Unknown"} color={COUNTRY_META[group.country?.code]?.color || "#6b7280"} />
        </div>
        <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 120 }}>
          <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>TACTIC DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={tacticChartData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
              <XAxis dataKey="name" tick={{ fill: "#3d5168", fontSize: 7 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3d5168", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CTooltip />} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {tacticChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Platform & Nation charts — hidden on narrow screens */}
        {!isNarrow && (
          <>
            <div style={{ width: 190, flexShrink: 0 }}>
              <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>PLATFORMS</div>
              <BarChart width={186} height={Math.max(72, platformData.length * 18)} data={platformData} layout="vertical" margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8b949e", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="count" fill="#00d4ff" radius={[0, 2, 2, 0]} background={{ fill: "#0d1117" }} />
              </BarChart>
            </div>
            <div style={{ width: 90, flexShrink: 0 }}>
              <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>BY NATION</div>
              <ResponsiveContainer width="100%" height={72}>
                <PieChart>
                  <Pie data={countryDist} dataKey="count" cx="50%" cy="50%" innerRadius={16} outerRadius={30} paddingAngle={2}>
                    {countryDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n, p) => [v + " groups", p.payload.code]}
                    contentStyle={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}
                    itemStyle={{ color: "#c9d1d9" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Group header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #1e2d3d", padding: "6px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{group.country?.flag}</span>
        <a href={`https://attack.mitre.org/groups/${group.id}/`} target="_blank" rel="noreferrer"
          style={{ color: "#00ff88", fontWeight: "bold", fontSize: 14, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
          {group.name}
        </a>
        <span style={{ color: "#3d5168", fontSize: 11 }}>{group.id}</span>
        {!isNarrow && (
          <span style={{ color: "#3d5168", fontSize: 9, marginLeft: 8 }}>▼ タクティクス/テクニック をクリックで詳細表示</span>
        )}
      </div>

      {/* Main area: kill chain + side panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: isNarrow ? "column" : "row", overflow: "hidden" }}>
        {/* Kill chain matrix */}
        <div ref={scrollRef} className="scroll-touch" style={{ flex: 1, overflowX: "auto", overflowY: "auto", padding: "10px 14px", background: "#070c12", minHeight: isNarrow && panelOpen ? "55%" : undefined }}>
          <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
            {usedTactics.map(tactic => (
              <div key={tactic} style={{ width: 148, flexShrink: 0 }}>
                <div onClick={() => handleTacticClick(tactic)}
                  style={{ background: selTactic === tactic ? TACTIC_CLR[tactic] + "44" : TACTIC_CLR[tactic] + "22", border: `1px solid ${selTactic === tactic ? TACTIC_CLR[tactic] : TACTIC_CLR[tactic] + "55"}`, borderRadius: "4px 4px 0 0", padding: "5px 6px", textAlign: "center", color: TACTIC_CLR[tactic], fontSize: 9, fontWeight: "bold", letterSpacing: 1, cursor: "pointer", transition: "all 0.15s", minHeight: 34 }}
                  onMouseEnter={e => { if (selTactic !== tactic) e.currentTarget.style.background = TACTIC_CLR[tactic] + "33"; }}
                  onMouseLeave={e => { if (selTactic !== tactic) e.currentTarget.style.background = TACTIC_CLR[tactic] + "22"; }}>
                  {TACTIC_SHORT[tactic]} <span style={{ opacity: 0.6 }}>({byTactic[tactic].length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 3 }}>
                  {byTactic[tactic].map(tech => (
                    <TechCard key={tech.id} tech={tech} tactic={tactic}
                      isSelected={selTech?.id === tech.id}
                      onClick={() => handleTechClick(tech)}
                      selSub={selTech?.id === tech.id ? selSub : null}
                      onSubClick={handleSubClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        {panelOpen && (
          <div style={panelStyle}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e2d3d", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                {selTactic ? (
                  <span style={{ color: TACTIC_CLR[selTactic], fontWeight: "bold", fontSize: 13 }}>
                    {TACTIC_INFO[selTactic]?.id}
                  </span>
                ) : (
                  <>
                    <span style={{ color: "#00d4ff", fontWeight: "bold", fontSize: 13 }}>{detailItem?.id}</span>
                    {selSub && <span style={{ color: "#3d5168", fontSize: 11, marginLeft: 6 }}>← {selTech?.id}</span>}
                    {selSub && <span style={{ fontSize: 9, color: "#a855f7", background: "#a855f722", padding: "2px 6px", borderRadius: 3, border: "1px solid #a855f755", marginLeft: 6 }}>SUB</span>}
                  </>
                )}
              </div>
              <button onClick={closePanel}
                style={{ background: "none", border: "none", color: "#3d5168", cursor: "pointer", fontSize: 18, padding: "4px 8px", minWidth: 36, minHeight: 36 }}>✕</button>
            </div>

            <div className="scroll-touch" style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              {selTactic && TACTIC_INFO[selTactic] && (() => {
                const info = TACTIC_INFO[selTactic];
                const clr  = TACTIC_CLR[selTactic];
                return (
                  <div>
                    <div style={{ color: clr, fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>{info.name}</div>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 3, background: clr + "22", color: clr, border: `1px solid ${clr}55` }}>{info.id}</span>
                    </div>
                    <a href={`https://attack.mitre.org/tactics/${info.id}/`} target="_blank" rel="noreferrer"
                      style={{ color: "#00d4ff", fontSize: 11, textDecoration: "none", display: "block", marginBottom: 14 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                      ↗ attack.mitre.org/tactics/{info.id}/
                    </a>
                    <div style={{ color: "#8b949e", fontSize: 12, lineHeight: 1.8, borderLeft: `3px solid ${clr}66`, paddingLeft: 12 }}>
                      {info.desc}
                    </div>
                    <div style={{ marginTop: 16, borderTop: "1px solid #1e2d3d", paddingTop: 12 }}>
                      <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>このグループのテクニック ({byTactic[selTactic]?.length})</div>
                      {byTactic[selTactic]?.map(t => (
                        <div key={t.id} onClick={() => handleTechClick(t)}
                          style={{ background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 3, padding: "6px 8px", marginBottom: 3, cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = clr + "88"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2d3d"}>
                          <span style={{ color: clr, fontSize: 10 }}>{t.id}</span>
                          <span style={{ color: "#8b949e", fontSize: 10, marginLeft: 6 }}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {detailItem && !selTactic && (
                <>
                  <div style={{ color: "#c9d1d9", fontWeight: "bold", fontSize: 14, marginBottom: 6 }}>{detailItem.name}</div>

                  {!selSub && selTech?.tactics && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {selTech.tactics.map(t => (
                        <span key={t} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: TACTIC_CLR[t] + "33", color: TACTIC_CLR[t], border: `1px solid ${TACTIC_CLR[t]}55` }}>{TACTIC_SHORT[t]}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>{detailItem.description}</div>

                  {!selSub && selTech?.platforms && (
                    <>
                      <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>PLATFORMS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                        {selTech.platforms.map(p => (
                          <span key={p} style={{ fontSize: 10, color: "#4a6378", background: "#111923", padding: "2px 7px", borderRadius: 3, border: "1px solid #1e2d3d" }}>{p}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {!selSub && selTech?.subs?.length > 0 && (
                    <>
                      <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>SUBTECHNIQUES ({selTech.subs.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 14 }}>
                        {selTech.subs.map(s => (
                          <div key={s.id} onClick={() => handleSubClick(s)}
                            style={{ background: selSub?.id === s.id ? "#a855f722" : "#070c12", border: `1px solid ${selSub?.id === s.id ? "#a855f7" : "#1e2d3d"}`, borderRadius: 3, padding: "6px 8px", cursor: "pointer", transition: "all 0.1s" }}>
                            <div style={{ color: "#a855f7", fontSize: 10 }}>{s.id}</div>
                            <div style={{ color: "#8b949e", fontSize: 10 }}>{s.name}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              <div style={{ borderTop: "1px solid #1e2d3d", margin: "10px 0" }} />

              {!hasApiKey && (
                <div style={{ background: "#f59e0b11", border: "1px solid #f59e0b44", borderRadius: 4, padding: "10px 12px", marginBottom: 12, fontSize: 11, color: "#f59e0b", lineHeight: 1.6 }}>
                  ⚠ APIキーが未設定です。右上の ⚙ 設定 から入力してください。
                </div>
              )}
              <button onClick={generate} disabled={loading || !hasApiKey}
                style={{ width: "100%", background: loading ? "#012a15" : hasApiKey ? "#00ff8822" : "#1e2d3d", color: loading ? "#00ff88" : hasApiKey ? "#00ff88" : "#4a6378", border: `1px solid ${hasApiKey ? "#00ff88" : "#1e2d3d"}`, borderRadius: 4, padding: "11px 14px", fontSize: 11, fontWeight: "bold", cursor: (loading || !hasApiKey) ? "default" : "pointer", fontFamily: "monospace", letterSpacing: 1, transition: "all 0.2s", minHeight: 44 }}>
                {loading ? "ANALYZING..." : "▶ GENERATE SCENARIO"}
              </button>

              {(scenario || loading) && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ color: "#00ff88", fontSize: 9, fontWeight: "bold", marginBottom: 8, letterSpacing: 2 }}>// AI-GENERATED SCENARIO</div>
                  {loading
                    ? <div style={{ color: "#00ff8866", fontSize: 11 }}>Correlating TTPs and generating scenario...</div>
                    : <div style={{ color: "#a8c7a0", fontSize: 11, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{scenario}</div>
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
