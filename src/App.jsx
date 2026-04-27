import { useState } from "react";
import { COUNTRY_META, TACTIC_ORDER, TACTIC_SHORT } from "./constants.js";
import { useAttackData } from "./hooks/useAttackData.js";
import Sidebar from "./components/Sidebar.jsx";
import NetworkGraph from "./components/NetworkGraph.jsx";
import DataUpdateModal from "./components/DataUpdateModal.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import AboutModal from "./components/AboutModal.jsx";
import KillChain from "./views/KillChain.jsx";
import ImpactAnalysis from "./views/ImpactAnalysis.jsx";
import DefenseGapMap from "./views/DefenseGapMap.jsx";
import ThreatBriefing from "./views/ThreatBriefing.jsx";

const TABS = [
  ["killchain",  "⬛ KILL CHAIN"],
  ["network",    "◉ NETWORK GRAPH"],
  ["impact",     "⚡ IMPACT ANALYSIS"],
  ["defense",    "🛡 DEFENSE GAP MAP"],
  ["briefing",   "🤖 AI BRIEFING"],
];

export default function App() {
  const { groups, links, techniques, metadata, loading, error, isStale, triggerUpdate } = useAttackData();
  const [selId, setSelId]             = useState(null);
  const [view, setView]               = useState("killchain");
  const [search, setSearch]           = useState("");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading]   = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [showAbout, setShowAbout]           = useState(false);

  const effectiveSelId = selId || groups[0]?.id;
  const group = groups.find(g => g.id === effectiveSelId);

  const handleSelect = id => { setSelId(id); };

  const handleUpdate = async source => {
    setUpdateLoading(true);
    await triggerUpdate(source);
    setUpdateLoading(false);
    setShowUpdateModal(false);
  };

  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" }) : null;

  // Network view needs links filtered by countryFilter
  const networkGroups = countryFilter === "ALL" ? groups : groups.filter(g => g.country?.code === countryFilter);

  return (
    <div style={{ minHeight: "100vh", background: "#070c12", color: "#c9d1d9", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #1e2d3d", padding: "9px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{ color: "#00ff88", fontWeight: "bold", fontSize: 13, letterSpacing: 3 }}>◈ ATT&CK SCENARIO ENGINE</div>
        <div style={{ color: "#3d5168", fontSize: 11 }}>MITRE ATT&CK® Enterprise · {loading ? "…" : groups.length} groups</div>

        {/* Last updated badge */}
        {metadata?.lastUpdated && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isStale && (
              <span style={{ background: "#f59e0b22", border: "1px solid #f59e0b55", borderRadius: 3, padding: "2px 6px", color: "#f59e0b", fontSize: 9, letterSpacing: 1 }}>
                ⚠ STALE
              </span>
            )}
            <span style={{ color: "#3d5168", fontSize: 10 }}>
              Last updated: {fmtDate(metadata.lastUpdated)}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ background: view === v ? "#00ff8822" : "transparent", border: `1px solid ${view === v ? "#00ff88" : "#1e2d3d"}`, borderRadius: 4, padding: "4px 12px", fontSize: 11, color: view === v ? "#00ff88" : "#4a6378", cursor: "pointer", fontFamily: "monospace", letterSpacing: 1, transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
          {/* Data update button */}
          <button onClick={() => setShowUpdateModal(true)}
            style={{ background: isStale ? "#f59e0b22" : "transparent", border: `1px solid ${isStale ? "#f59e0b" : "#1e2d3d"}`, borderRadius: 4, padding: "4px 12px", fontSize: 11, color: isStale ? "#f59e0b" : "#4a6378", cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
            ↻ Update Data
          </button>
          <button onClick={() => setShowSettings(true)}
            style={{ background: "transparent", border: "1px solid #1e2d3d", borderRadius: 4, padding: "4px 12px", fontSize: 11, color: "#4a6378", cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
            ⚙ Settings
          </button>
          <button onClick={() => setShowAbout(true)}
            style={{ background: "transparent", border: "1px solid #1e2d3d", borderRadius: 4, padding: "4px 12px", fontSize: 11, color: "#4a6378", cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
            ⓘ About
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: "#ef444422", borderBottom: "1px solid #ef4444", padding: "8px 20px", color: "#ef4444", fontSize: 11 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !groups.length && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#3d5168", fontSize: 13 }}>
          Loading ATT&CK data...
        </div>
      )}

      {/* Main layout */}
      {!!groups.length && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar — shown for killchain & network views */}
          {(view === "killchain" || view === "network") && (
            <Sidebar
              groups={groups}
              selId={effectiveSelId}
              onSelect={handleSelect}
              search={search}
              onSearch={setSearch}
              countryFilter={countryFilter}
              onCountryFilter={setCountryFilter}
            />
          )}

          {/* Content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {view === "killchain" && (
              <KillChain group={group} groups={groups} onSelectGroup={handleSelect} />
            )}

            {view === "network" && (
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1, position: "relative", background: "#070c12" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: "#0d1117ee", border: "1px solid #1e2d3d", borderRadius: 6, padding: "10px 14px" }}>
                    <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>LEGEND</div>
                    {Object.entries(COUNTRY_META).map(([code, m]) => (
                      <div key={code} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color + "44", border: `1.5px solid ${m.color}`, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: "#8b949e" }}>{m.flag} {m.label}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #1e2d3d", marginTop: 8, paddingTop: 8, color: "#3d5168", fontSize: 9, lineHeight: 1.6 }}>
                      エッジの太さ = 共有テクニック数<br />
                      閾値: 7以上で表示<br />
                      ドラッグ / スクロールでズーム
                    </div>
                  </div>
                  {group && (
                    <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, background: "#0d1117ee", border: "1px solid #00ff8833", borderRadius: 6, padding: "10px 14px", maxWidth: 220 }}>
                      <div style={{ color: "#00ff88", fontWeight: "bold", fontSize: 12 }}>{group.country?.flag} {group.name}</div>
                      <div style={{ color: "#3d5168", fontSize: 10, marginBottom: 6 }}>{group.id}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #1e2d3d" }}>
                        <span style={{ fontSize: 9, color: "#3d5168" }}>関連グループ</span>
                        <span style={{ fontSize: 9, color: "#3d5168" }}>共有テクニック数</span>
                      </div>
                      {links
                        .filter(l => (l.source === effectiveSelId || l.target === effectiveSelId) && l.value >= 5)
                        .slice(0, 6)
                        .map(l => {
                          const oid = l.source === effectiveSelId ? l.target : l.source;
                          const g2 = groups.find(g => g.id === oid);
                          return g2 ? (
                            <div key={oid} onClick={() => handleSelect(oid)}
                              style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1e2d3d", cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.6"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                              <span style={{ fontSize: 11, color: "#8b949e" }}>{g2.country?.flag} {g2.name}</span>
                              <span style={{ fontSize: 11, color: "#00ff88", fontWeight: "bold" }}>{l.value}</span>
                            </div>
                          ) : null;
                        })
                      }
                    </div>
                  )}
                  <NetworkGraph
                    groups={networkGroups}
                    links={links}
                    onSelectGroup={handleSelect}
                    selId={effectiveSelId}
                    countryFilter={countryFilter}
                  />
                </div>
              </div>
            )}

            {view === "impact" && (
              <ImpactAnalysis
                groups={groups}
                onSelectGroup={handleSelect}
                onSwitchToKillChain={() => setView("killchain")}
              />
            )}

            {view === "defense" && (
              <DefenseGapMap groups={groups} techniques={techniques} />
            )}

            {view === "briefing" && (
              <ThreatBriefing groups={groups} />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: "#0d1117", borderTop: "1px solid #1e2d3d", padding: "6px 20px", flexShrink: 0, textAlign: "center", fontSize: 10, color: "#3d5168" }}>
        Powered by MITRE ATT&amp;CK® &nbsp;|&nbsp; © 2025 The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation. &nbsp;|&nbsp;
        <a href="https://attack.mitre.org/resources/legal-and-branding/terms-of-use/" target="_blank" rel="noreferrer" style={{ color: "#3d5168", textDecoration: "underline" }}>ATT&amp;CK Terms of Use</a>
        &nbsp;|&nbsp; © 2025 <a href="https://hariolab.net" target="_blank" rel="noreferrer" style={{ color: "#3d5168", textDecoration: "underline" }}>hario-lab</a>
      </div>

      {/* Data update modal */}
      {showUpdateModal && (
        <DataUpdateModal
          metadata={metadata}
          isStale={isStale}
          loading={updateLoading}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={handleUpdate}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAbout    && <AboutModal    onClose={() => setShowAbout(false)} />}
    </div>
  );
}
