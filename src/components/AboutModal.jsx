export default function AboutModal({ onClose }) {
  const overlay = { position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
  const modal   = { background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 8, padding: "28px 32px", width: 440, fontFamily: "monospace", color: "#c9d1d9" };
  const link    = { color: "#3b82f6", textDecoration: "none" };
  const row     = { display: "flex", gap: 12, marginBottom: 6, fontSize: 11 };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ color: "#00ff88", fontWeight: "bold", fontSize: 14, letterSpacing: 2 }}>ATT&CK Scenario Engine</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#3d5168", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <p style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.7, marginBottom: 18 }}>
          本ツールはMITRE ATT&CK®データを使用しています。
        </p>

        <div style={{ background: "#070c12", border: "1px solid #1e2d3d", borderRadius: 6, padding: "14px 16px", marginBottom: 18, fontSize: 11, color: "#6b7280", lineHeight: 1.8 }}>
          © 2025 The MITRE Corporation.<br />
          This work is reproduced and distributed<br />
          with the permission of The MITRE Corporation.
        </div>

        <div>
          <div style={row}>
            <span style={{ color: "#3d5168", minWidth: 90 }}>ATT&CK®</span>
            <a href="https://attack.mitre.org" target="_blank" rel="noreferrer" style={link}>https://attack.mitre.org</a>
          </div>
          <div style={row}>
            <span style={{ color: "#3d5168", minWidth: 90 }}>Terms of Use</span>
            <a href="https://attack.mitre.org/resources/legal-and-branding/terms-of-use/" target="_blank" rel="noreferrer" style={link}>
              https://attack.mitre.org/resources/legal-and-branding/terms-of-use/
            </a>
          </div>
          <div style={row}>
            <span style={{ color: "#3d5168", minWidth: 90 }}>Data Source</span>
            <a href="https://github.com/mitre/cti" target="_blank" rel="noreferrer" style={link}>https://github.com/mitre/cti</a>
          </div>
        </div>
      </div>
    </div>
  );
}
