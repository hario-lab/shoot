import { useState, useCallback } from "react";
import { INDUSTRIES } from "../constants.js";
import { callAnthropicAPI, getStoredApiKey } from "../utils/apiClient.js";

const HISTORY_KEY = "attack_briefing_history_v1";
const MAX_HISTORY = 10;
const PERIODS = ["指定なし", "2025年", "2024年", "2023-2025年", "2022-2025年"];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

function buildExecutivePrompt(group, industry, period) {
  const techList = group.techniques.slice(0, 20).map(t => t.name).join(", ");
  return `You are a cybersecurity advisor writing a briefing for executive leadership (C-suite/board level).

Threat Actor: ${group.name} (${group.id}) — ${group.country?.name || "Unknown origin"}
Target Industry: ${industry}
Time Period: ${period}
Key TTPs: ${techList}

Write a concise executive briefing (3-4 paragraphs) covering:
1. Who this threat actor is and why they target ${industry}
2. What business risks and potential impacts they pose
3. Strategic recommendations for risk reduction (non-technical)
4. Urgency assessment

Use plain business language. Avoid technical jargon. Focus on financial, operational, and reputational risk.`;
}

function buildSocPrompt(group, industry, period) {
  const techList = group.techniques.map(t =>
    `${t.id} ${t.name}${t.subs?.length ? ` [subs: ${t.subs.map(s => s.id).join(",")}]` : ""} [${t.tactics[0]}]`
  ).join("\n");
  return `You are a threat intelligence analyst writing a SOC analyst briefing.

Threat Actor: ${group.name} (${group.id}) — ${group.country?.name || "Unknown origin"}
Target Industry: ${industry}
Time Period: ${period}
Known TTPs:
${techList}

Write a detailed SOC analyst briefing covering:
1. Threat actor profile and known infrastructure patterns
2. Attack chain analysis (step-by-step TTP breakdown using MITRE ATT&CK IDs)
3. Specific detection opportunities per technique (SIEM rules, EDR alerts, network signatures)
4. Recommended IOC hunting queries
5. Prioritized defensive controls

Include specific technique IDs. Use technical detail appropriate for tier-2/3 SOC analysts.`;
}

export default function ThreatBriefing({ groups }) {
  const [selGroupId, setSelGroupId] = useState(groups[0]?.id || "");
  const [industry, setIndustry]     = useState("All Industries");
  const [period, setPeriod]         = useState("指定なし");
  const [loading, setLoading]       = useState(false);
  const [report, setReport]         = useState(null);
  const [history, setHistory]       = useState(loadHistory);
  const [selHistory, setSelHistory] = useState(null);

  const group = groups.find(g => g.id === selGroupId) || groups[0];
  const hasApiKey = !!getStoredApiKey();

  const generate = useCallback(async (type) => {
    if (!group || loading) return;
    setLoading(true);
    setSelHistory(null);
    const prompt = type === "executive"
      ? buildExecutivePrompt(group, industry, period)
      : buildSocPrompt(group, industry, period);
    try {
      const d = await callAnthropicAPI({ model: "claude-sonnet-4-6", max_tokens: 2000, messages: [{ role: "user", content: prompt }] });
      const text = d.content?.find(c => c.type === "text")?.text || d.error?.message || "Error";
      const entry = {
        id: Date.now(),
        type,
        groupId: group.id,
        groupName: group.name,
        industry,
        period,
        text,
        createdAt: new Date().toISOString(),
      };
      setReport(entry);
      const newHistory = [entry, ...history].slice(0, MAX_HISTORY);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (e) {
      setReport({ id: Date.now(), type, groupId: group.id, groupName: group.name, industry, period, text: "Error: " + e.message, createdAt: new Date().toISOString() });
    }
    setLoading(false);
  }, [group, industry, period, loading, history]);

  const displayReport = selHistory || report;

  const exportMd = () => {
    if (!displayReport) return;
    const typeLabel = displayReport.type === "executive" ? "経営層向け" : "SOCアナリスト向け";
    const md = `# 脅威ブリーフィング — ${typeLabel}\n\n**脅威アクター:** ${displayReport.groupName} (${displayReport.groupId})\n**対象業種:** ${displayReport.industry}\n**対象期間:** ${displayReport.period}\n**生成日時:** ${new Date(displayReport.createdAt).toLocaleString("ja-JP")}\n\n---\n\n${displayReport.text}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `briefing_${displayReport.groupId}_${displayReport.type}_${displayReport.createdAt.slice(0, 10)}.md`;
    a.click();
  };

  const inputStyle = {
    background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 4,
    padding: "6px 10px", color: "#c9d1d9", fontSize: 11, fontFamily: "monospace",
    outline: "none", appearance: "none", cursor: "pointer",
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "#070c12" }}>
      {/* Left: form + report */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Form */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2d3d", background: "#0d1117", flexShrink: 0 }}>
          <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>
            レポート生成フォーム — Claude API を使用
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ color: "#3d5168", fontSize: 9, marginBottom: 4 }}>対象グループ</div>
              <select value={selGroupId} onChange={e => setSelGroupId(e.target.value)} style={{ ...inputStyle, width: 200 }}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.country?.flag} {g.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: "#3d5168", fontSize: 9, marginBottom: 4 }}>対象業種</div>
              <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...inputStyle, width: 160 }}>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: "#3d5168", fontSize: 9, marginBottom: 4 }}>対象期間</div>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ ...inputStyle, width: 140 }}>
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => generate("executive")} disabled={loading || !hasApiKey}
                style={{ background: loading ? "#012a15" : "#001a0d", border: `1px solid ${hasApiKey ? "#00ff88" : "#1e2d3d"}`, borderRadius: 4, padding: "7px 14px", color: hasApiKey ? "#00ff88" : "#4a6378", cursor: (loading || !hasApiKey) ? "default" : "pointer", fontSize: 11, fontFamily: "monospace" }}>
                {loading ? "生成中..." : "📋 経営層向けレポート"}
              </button>
              <button onClick={() => generate("soc")} disabled={loading || !hasApiKey}
                style={{ background: "#0a0d1a", border: `1px solid ${hasApiKey ? "#3b82f6" : "#1e2d3d"}`, borderRadius: 4, padding: "7px 14px", color: hasApiKey ? "#3b82f6" : "#4a6378", cursor: (loading || !hasApiKey) ? "default" : "pointer", fontSize: 11, fontFamily: "monospace" }}>
                {loading ? "生成中..." : "🔍 SOCアナリスト向けレポート"}
              </button>
            </div>
          </div>
          {group && (
            <div style={{ marginTop: 10, color: "#4a6378", fontSize: 10 }}>
              {group.country?.flag} {group.name} · {group.techniques.length} techniques · {group.description?.slice(0, 100)}…
            </div>
          )}
        </div>

        {/* Report content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading && (
            <div style={{ color: "#00ff8866", fontSize: 12, textAlign: "center", marginTop: 40 }}>
              <div style={{ marginBottom: 8 }}>レポートを生成中...</div>
              <div style={{ color: "#3d5168", fontSize: 10 }}>Claude API が分析しています。しばらくお待ちください。</div>
            </div>
          )}
          {!loading && displayReport && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <span style={{ color: displayReport.type === "executive" ? "#00ff88" : "#3b82f6", fontWeight: "bold", fontSize: 13 }}>
                    {displayReport.type === "executive" ? "📋 経営層向けレポート" : "🔍 SOCアナリスト向けレポート"}
                  </span>
                  <span style={{ color: "#3d5168", fontSize: 11, marginLeft: 10 }}>
                    {displayReport.groupName} · {displayReport.industry} · {displayReport.period}
                  </span>
                </div>
                <button onClick={exportMd}
                  style={{ background: "transparent", border: "1px solid #1e2d3d", borderRadius: 4, padding: "4px 12px", color: "#4a6378", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>
                  ⬇ .md エクスポート
                </button>
              </div>
              <div style={{ background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 6, padding: "16px 20px", color: "#c9d1d9", fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {displayReport.text}
              </div>
              <div style={{ color: "#3d5168", fontSize: 10, marginTop: 8 }}>
                生成: {new Date(displayReport.createdAt).toLocaleString("ja-JP")}
              </div>
            </div>
          )}
          {!loading && !displayReport && (
            <div style={{ textAlign: "center", marginTop: 60 }}>
              {!hasApiKey ? (
                <div style={{ display: "inline-block", background: "#f59e0b11", border: "1px solid #f59e0b44", borderRadius: 6, padding: "20px 28px", maxWidth: 380 }}>
                  <div style={{ color: "#f59e0b", fontSize: 14, marginBottom: 10 }}>⚠ APIキーが未設定です</div>
                  <div style={{ color: "#8b949e", fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
                    右上の ⚙ 設定 ボタンからAnthropicのAPIキーを入力してください。
                  </div>
                  <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
                    style={{ color: "#3b82f6", fontSize: 11, textDecoration: "none" }}>
                    → console.anthropic.com でAPIキーを取得
                  </a>
                </div>
              ) : (
                <div style={{ color: "#3d5168", fontSize: 13 }}>
                  グループ・業種・期間を選択してレポートを生成してください
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: history panel */}
      <div style={{ width: 240, borderLeft: "1px solid #1e2d3d", background: "#0d1117", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e2d3d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2 }}>レポート履歴</span>
          <span style={{ color: "#4a6378", fontSize: 9 }}>{history.length}/{MAX_HISTORY}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {history.length === 0 ? (
            <div style={{ color: "#3d5168", fontSize: 10, textAlign: "center", padding: "20px 12px" }}>
              履歴なし
            </div>
          ) : history.map(h => (
            <div key={h.id}
              onClick={() => setSelHistory(h)}
              style={{ padding: "10px 12px", borderBottom: "1px solid #1e2d3d", cursor: "pointer", background: selHistory?.id === h.id ? "#070c12" : "transparent", transition: "background 0.1s" }}
              onMouseEnter={e => { if (selHistory?.id !== h.id) e.currentTarget.style.background = "#070c12"; }}
              onMouseLeave={e => { if (selHistory?.id !== h.id) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: h.type === "executive" ? "#00ff88" : "#3b82f6" }}>
                  {h.type === "executive" ? "📋 経営" : "🔍 SOC"}
                </span>
                <span style={{ color: "#8b949e", fontSize: 10 }}>{h.groupName}</span>
              </div>
              <div style={{ color: "#4a6378", fontSize: 9 }}>{h.industry} · {h.period}</div>
              <div style={{ color: "#3d5168", fontSize: 9, marginTop: 2 }}>
                {new Date(h.createdAt).toLocaleString("ja-JP", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" })}
              </div>
            </div>
          ))}
        </div>
        {history.length > 0 && (
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1e2d3d" }}>
            <button onClick={() => { setHistory([]); saveHistory([]); setSelHistory(null); }}
              style={{ background: "transparent", border: "1px solid #1e2d3d", borderRadius: 3, padding: "4px 8px", color: "#3d5168", cursor: "pointer", fontSize: 9, width: "100%", fontFamily: "monospace" }}>
              履歴をクリア
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
