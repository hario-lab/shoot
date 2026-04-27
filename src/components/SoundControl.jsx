import { useState, useEffect, useRef } from "react";

const ICON = {
  MECHANICAL: "⌨",
  CYBER:      "📡",
  MILITARY:   "📻",
  SUBTLE:     "🔈",
  OFF:        "🔇",
};

export default function SoundControl({ soundType, setSoundType, playClick, SOUND_TYPES }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (id) => {
    setSoundType(id);
    setOpen(false);
    // OFFでなければ選択音を鳴らす（新しい音種で即再生）
    if (id !== "OFF") {
      // playClick は古い soundType を参照するため、
      // 直接 AudioContext で新しい音を鳴らす
      setTimeout(playClick, 0);
    }
  };

  const icon    = ICON[soundType] || "🔊";
  const isOff   = soundType === "OFF";
  const accent  = isOff ? "#3d5168" : "#00ff88";
  const bgColor = isOff ? "transparent" : "#00ff8811";
  const border  = isOff ? "#1e2d3d" : "#00ff8866";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* トリガーボタン */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Sound type"
        style={{
          background: bgColor,
          border: `1px solid ${border}`,
          borderRadius: 4,
          padding: "4px 10px",
          fontSize: 11,
          color: accent,
          cursor: "pointer",
          fontFamily: "monospace",
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span>{soundType}</span>
        <span style={{ opacity: 0.5, fontSize: 9 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* ドロップダウン */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          background: "#0d1117",
          border: "1px solid #1e2d3d",
          borderRadius: 6,
          overflow: "hidden",
          zIndex: 100,
          minWidth: 210,
          boxShadow: "0 8px 24px #00000088",
        }}>
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #1e2d3d" }}>
            <span style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2 }}>SOUND TYPE</span>
          </div>
          {SOUND_TYPES.map(({ id, label, desc }) => {
            const active  = soundType === id;
            const itemClr = active ? "#00ff88" : "#8b949e";
            return (
              <div
                key={id}
                onClick={() => handleSelect(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  cursor: "pointer",
                  background: active ? "#00ff8811" : "transparent",
                  borderLeft: `3px solid ${active ? "#00ff88" : "transparent"}`,
                  transition: "all 0.1s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#ffffff08"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{ICON[id]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: itemClr, fontWeight: active ? "bold" : "normal", fontSize: 11, letterSpacing: 1 }}>
                    {label}
                  </div>
                  <div style={{ color: "#3d5168", fontSize: 9, marginTop: 1 }}>{desc}</div>
                </div>
                {active && (
                  <span style={{ color: "#00ff88", fontSize: 10, flexShrink: 0 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
