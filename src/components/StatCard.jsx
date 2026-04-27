export default function StatCard({ label, value, sub, color = "#00ff88" }) {
  return (
    <div style={{ background: "#0d1117", border: `1px solid ${color}33`, borderRadius: 6, padding: "8px 12px", minWidth: 80 }}>
      <div style={{ color: "#3d5168", fontSize: 9, letterSpacing: 2, marginBottom: 2 }}>{label}</div>
      <div style={{ color, fontSize: 18, fontWeight: "bold", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: "#4a6378", fontSize: 9, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
