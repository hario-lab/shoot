export default function DataUpdateModal({ metadata, isStale, loading, onClose, onUpdate }) {
  const fmt = ts => ts ? new Date(ts).toLocaleString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—";

  return (
    <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           style={{ background:"#0d1117", border:"1px solid #1e2d3d", borderRadius:8, padding:28, width:440, fontFamily:"monospace" }}>
        <div style={{ color:"#00ff88", fontWeight:"bold", fontSize:14, marginBottom:16, letterSpacing:2 }}>
          ◈ データ更新
        </div>

        <div style={{ background:"#070c12", border:"1px solid #1e2d3d", borderRadius:6, padding:12, marginBottom:20, fontSize:11 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:"#3d5168" }}>最終更新</span>
            <span style={{ color: isStale ? "#f59e0b" : "#00ff88" }}>{fmt(metadata?.lastUpdated)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:"#3d5168" }}>ソース</span>
            <span style={{ color:"#8b949e" }}>{metadata?.version || "—"}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:"#3d5168" }}>グループ数</span>
            <span style={{ color:"#8b949e" }}>{metadata?.groupCount ?? "—"}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#3d5168" }}>テクニック数</span>
            <span style={{ color:"#8b949e" }}>{metadata?.techniqueCount ?? "—"}</span>
          </div>
          {isStale && (
            <div style={{ marginTop:10, color:"#f59e0b", fontSize:10, background:"#f59e0b11", border:"1px solid #f59e0b33", borderRadius:4, padding:"6px 10px" }}>
              ⚠ データが6ヶ月以上更新されていません。ATT&CKは年2回（4月・10月頃）更新されます。
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={() => onUpdate("local")} disabled={loading}
            style={{ background:"#001a0d", border:"1px solid #00ff88", borderRadius:6, padding:"10px 16px", color:"#00ff88", cursor:loading?"default":"pointer", fontSize:11, textAlign:"left" }}>
            <div style={{ fontWeight:"bold", marginBottom:3 }}>a) ローカル再読み込み</div>
            <div style={{ color:"#4a6378", fontSize:10 }}>enterprise-attack.json または AttackScenarioEngine.jsx から再処理</div>
          </button>
          <button onClick={() => onUpdate("mitre")} disabled={loading}
            style={{ background:"#0a0d1a", border:"1px solid #3b82f6", borderRadius:6, padding:"10px 16px", color:"#3b82f6", cursor:loading?"default":"pointer", fontSize:11, textAlign:"left" }}>
            <div style={{ fontWeight:"bold", marginBottom:3 }}>b) MITRE GitHub から取得</div>
            <div style={{ color:"#4a6378", fontSize:10 }}>最新の ATT&CK Enterprise STIX データを自動取得・再処理（数分かかる場合があります）</div>
          </button>
        </div>

        {loading && (
          <div style={{ marginTop:16, color:"#00ff8866", fontSize:11, textAlign:"center" }}>
            処理中... しばらくお待ちください
          </div>
        )}

        <button onClick={onClose}
          style={{ marginTop:16, width:"100%", background:"transparent", border:"1px solid #1e2d3d", borderRadius:4, padding:"7px", color:"#4a6378", cursor:"pointer", fontSize:11 }}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
