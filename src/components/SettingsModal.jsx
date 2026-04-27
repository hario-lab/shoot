import { useState } from "react";
import { getStoredApiKey, setStoredApiKey, callAnthropicAPI } from "../utils/apiClient.js";

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey]     = useState(getStoredApiKey);
  const [show, setShow]         = useState(false);
  const [status, setStatus]     = useState(null); // null | "ok" | "error"
  const [testing, setTesting]   = useState(false);
  const [errMsg, setErrMsg]     = useState("");

  const save = () => {
    setStoredApiKey(apiKey);
    onClose();
  };

  const test = async () => {
    if (!apiKey.trim()) { setStatus("error"); setErrMsg("APIキーが入力されていません"); return; }
    setTesting(true);
    setStatus(null);
    setErrMsg("");
    // Temporarily set key for the test call
    const prev = getStoredApiKey();
    setStoredApiKey(apiKey);
    try {
      const d = await callAnthropicAPI({ model: "claude-haiku-4-5-20251001", max_tokens: 1, messages: [{ role: "user", content: "hi" }] });
      if (d.error) { setStatus("error"); setErrMsg(d.error.message || "API error"); }
      else { setStatus("ok"); }
    } catch (e) {
      setStatus("error");
      setErrMsg(e.message);
    }
    setStoredApiKey(prev);
    setTesting(false);
  };

  const overlay = { position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
  const modal   = { background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 8, padding: "24px 28px", width: 420, fontFamily: "monospace", color: "#c9d1d9" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ color: "#00ff88", fontWeight: "bold", fontSize: 13, letterSpacing: 2 }}>⚙ 設定</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#3d5168", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ marginBottom: 6, color: "#3d5168", fontSize: 10, letterSpacing: 1 }}>ANTHROPIC API KEY</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input
            type={show ? "text" : "password"}
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setStatus(null); }}
            placeholder="sk-ant-api..."
            style={{ flex: 1, background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 4, padding: "7px 10px", color: "#c9d1d9", fontSize: 12, fontFamily: "monospace", outline: "none" }}
          />
          <button onClick={() => setShow(v => !v)}
            style={{ background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 4, padding: "7px 10px", color: "#4a6378", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>
            {show ? "隠す" : "表示"}
          </button>
        </div>
        <div style={{ marginBottom: 16, fontSize: 10, color: "#3d5168" }}>
          APIキーは<a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>console.anthropic.com</a>で取得できます。localStorageに保存されます。
        </div>

        {status && (
          <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 4, background: status === "ok" ? "#00ff8811" : "#ef444411", border: `1px solid ${status === "ok" ? "#00ff8844" : "#ef444444"}`, fontSize: 11, color: status === "ok" ? "#00ff88" : "#ef4444" }}>
            {status === "ok" ? "✅ 接続成功 — APIキーは有効です" : `❌ ${errMsg}`}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={test} disabled={testing}
            style={{ background: "#070c12", border: "1px solid #3b82f6", borderRadius: 4, padding: "7px 14px", color: "#3b82f6", cursor: testing ? "default" : "pointer", fontSize: 11, fontFamily: "monospace" }}>
            {testing ? "テスト中..." : "🔌 テスト接続"}
          </button>
          <button onClick={save}
            style={{ background: "#00ff8822", border: "1px solid #00ff88", borderRadius: 4, padding: "7px 14px", color: "#00ff88", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: "bold" }}>
            💾 保存
          </button>
        </div>
      </div>
    </div>
  );
}
