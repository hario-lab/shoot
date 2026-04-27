import { useRef, useState, useCallback } from "react";

const STORAGE_KEY = "shoot_sound_type";

// ─── サウンドタイプ定義 ────────────────────────────────────────────
export const SOUND_TYPES = [
  { id: "MECHANICAL", label: "MECHANICAL", desc: "メカニカルキーボード" },
  { id: "CYBER",      label: "CYBER",      desc: "電子ビープ音" },
  { id: "MILITARY",   label: "MILITARY",   desc: "無線機クリック" },
  { id: "SUBTLE",     label: "SUBTLE",     desc: "控えめなタップ" },
  { id: "OFF",        label: "OFF",        desc: "無音" },
];

// ─── 各サウンド生成関数 ────────────────────────────────────────────

function playMechanical(ctx) {
  const t = ctx.currentTime;

  // ① ノイズ transient（キーの物理的な衝撃）
  const bufSize = Math.floor(ctx.sampleRate * 0.010);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 4000;
  bp.Q.value = 0.7;
  const noiseGain = ctx.createGain();
  noise.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(1.2, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
  noise.start(t);
  noise.stop(t + 0.015);

  // ② 短いオシレーター（スプリング音）
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.015);
  oscGain.gain.setValueAtTime(0.18, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
  osc.start(t);
  osc.stop(t + 0.02);
}

function playCyber(ctx) {
  const t = ctx.currentTime;

  // ① スウィープオシレーター（電子音）
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.045);
  oscGain.gain.setValueAtTime(0.10, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.start(t);
  osc.stop(t + 0.055);

  // ② ノイズレイヤー
  const bufSize = Math.floor(ctx.sampleRate * 0.025);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(0.04, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  noise.start(t);
  noise.stop(t + 0.03);
}

function playMilitary(ctx) {
  const t = ctx.currentTime;

  // ① バンドパスノイズ（無線機の帯域特性）
  const bufSize = Math.floor(ctx.sampleRate * 0.045);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 600;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2800;

  const dist = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = Math.tanh(x * 4);          // ソフトクリップ（無線歪み）
  }
  dist.curve = curve;

  const noiseGain = ctx.createGain();
  noise.connect(hp);
  hp.connect(lp);
  lp.connect(dist);
  dist.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // PTTクリック：急激なオン→フェードアウト
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.55, t + 0.004);
  noiseGain.gain.setValueAtTime(0.55, t + 0.018);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.048);
  noise.start(t);
  noise.stop(t + 0.055);

  // ② 低周波トランジェント
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og);
  og.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, t);
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  osc.start(t);
  osc.stop(t + 0.02);
}

function playSubtle(ctx) {
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(280, t + 0.022);
  gain.gain.setValueAtTime(0.055, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
  osc.start(t);
  osc.stop(t + 0.03);
}

// ─── フック本体 ────────────────────────────────────────────────────

export function useSound() {
  const [soundType, setSoundTypeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SOUND_TYPES.find(s => s.id === stored) ? stored : "MECHANICAL";
  });

  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playClick = useCallback(() => {
    if (soundType === "OFF") return;
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") ctx.resume();
      switch (soundType) {
        case "MECHANICAL": playMechanical(ctx); break;
        case "CYBER":      playCyber(ctx);      break;
        case "MILITARY":   playMilitary(ctx);   break;
        case "SUBTLE":     playSubtle(ctx);     break;
      }
    } catch (_) { /* AudioContext 非対応環境は無音で続行 */ }
  }, [soundType]);

  const setSoundType = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setSoundTypeState(id);
  }, []);

  return { soundType, setSoundType, playClick, SOUND_TYPES };
}
