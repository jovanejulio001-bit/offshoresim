// Canvas drawing for gauges, trends, well schematic and LOT plot (ported from ui.js).
import { S, clamp, type HistKey } from "./sim";
type G = CanvasRenderingContext2D;

export function gauge(g: G, x: number, y: number, r: number, v: number, max: number, name: string, unit: string) {
  g.save(); g.translate(x, y);
  g.fillStyle = "#0b1116"; g.beginPath(); g.arc(0, 0, r + 8, 0, 7); g.fill();
  g.strokeStyle = "#2a3540"; g.lineWidth = 2; g.stroke();
  g.strokeStyle = "#1e2a33"; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r, 0.75 * Math.PI, 2.25 * Math.PI); g.stroke();
  for (let i = 0; i <= 10; i++) { const a = (0.75 + 0.15 * i) * Math.PI; g.strokeStyle = "#6c7c88"; g.lineWidth = i % 5 ? 1 : 2; g.beginPath(); g.moveTo(Math.cos(a) * (r - 10), Math.sin(a) * (r - 10)); g.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4)); g.stroke(); }
  const f = clamp(v / max, 0, 1);
  g.strokeStyle = f > 0.85 ? "#ff4a3d" : f > 0.65 ? "#ffc23a" : "#3ddc84"; g.lineWidth = 7;
  g.beginPath(); g.arc(0, 0, r, 0.75 * Math.PI, (0.75 + 1.5 * f) * Math.PI); g.stroke();
  const a = (0.75 + 1.5 * f) * Math.PI; g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8)); g.stroke();
  g.fillStyle = "#ff8a3d"; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill();
  g.fillStyle = "#8fa3b3"; g.textAlign = "center"; g.font = "600 11px ui-sans-serif,system-ui"; g.fillText(name, 0, r + 22);
  g.fillStyle = "#e8f4ff"; g.font = "bold 13px ui-monospace,monospace"; g.fillText(v.toFixed(0) + " " + unit, 0, r * 0.55);
  g.restore();
}

export function chart(g: G, x: number, y: number, w: number, h: number, series: { d: number[]; c: string }[], title: string) {
  g.save(); g.translate(x, y); g.fillStyle = "#081016"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#16222c"; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, (h * i) / 4); g.lineTo(w, (h * i) / 4); g.stroke(); }
  g.strokeStyle = "#24333f"; g.strokeRect(0.5, 0.5, w - 1, h - 1);
  g.fillStyle = "#8fa3b3"; g.font = "600 11px ui-sans-serif,system-ui"; g.textAlign = "left"; g.fillText(title, 6, 14);
  let lo = 1e9, hi = -1e9; series.forEach((s) => s.d.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
  if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
  series.forEach((s) => { g.strokeStyle = s.c; g.lineWidth = 1.6; g.beginPath(); s.d.forEach((v, i) => { const px = (i / 119) * w, py = h - 4 - ((v - lo) / (hi - lo)) * (h - 24); if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); });
  const l = series[0]?.d ?? []; g.fillStyle = "#fff"; g.textAlign = "right"; g.font = "bold 12px ui-monospace,monospace"; g.fillText(l.length ? l[l.length - 1]!.toFixed(1) : "", w - 6, 14);
  g.restore();
}

export const GAUGES: [() => number, number, string, string][] = [
  [() => S.spp, 5000, "SPP", "psi"], [() => S.casP, 5000, "CASING", "psi"], [() => S.chk, 5000, "CHOKE", "psi"], [() => S.annP, 6000, "ANULAR", "psi"],
  [() => S.fin, 800, "FLOW IN", "gpm"], [() => S.fout, 800, "FLOW OUT", "gpm"], [() => S.pit, 800, "TANQUES", "bbl"], [() => S.hook, 400, "HOOK", "klb"],
];
export function drawGauges(g: G, W: number, H: number) {
  g.clearRect(0, 0, W, H); const cols = 4, rows = 2, cw = W / cols, ch = H / rows, r = Math.min(cw, ch) * 0.3;
  GAUGES.forEach((q, i) => gauge(g, cw * (i % cols) + cw / 2, ch * Math.floor(i / cols) + ch * 0.45, r, q[0](), q[1], q[2], q[3]));
}

const TRENDS: [{ k: HistKey; c: string }[], string][] = [
  [[{ k: "wob", c: "#5df08a" }], "WOB (klb)"], [[{ k: "rop", c: "#5ccfff" }], "ROP (m/h)"], [[{ k: "rpm", c: "#ffc95c" }], "RPM"], [[{ k: "tq", c: "#ff6fcf" }], "Torque (kft-lb)"],
  [[{ k: "hook", c: "#a6ff8f" }], "Hook Load (klb)"], [[{ k: "spp", c: "#ff965c" }], "SPP (psi)"], [[{ k: "fin", c: "#5ccfff" }, { k: "fout", c: "#ff5c5c" }], "Flow In / Out (gpm)"], [[{ k: "pit", c: "#ffd04a" }], "Pit Volume (bbl)"],
  [[{ k: "dens", c: "#c89bff" }], "Densidade (ppg)"], [[{ k: "depth", c: "#ffffff" }], "Profundidade broca (m)"],
];
export function drawTrends(g: G, W: number, H: number, n = TRENDS.length) {
  g.clearRect(0, 0, W, H); const cols = 2, rows = Math.ceil(n / cols), cw = W / cols, ch = H / rows;
  TRENDS.slice(0, n).forEach((t, i) => chart(g, (i % cols) * cw + 3, Math.floor(i / cols) * ch + 3, cw - 6, ch - 6, t[0].map((s) => ({ d: S.hist[s.k], c: s.c })), t[1]));
}

export function drawWell(g: G, W: number, H: number) {
  g.clearRect(0, 0, W, H); const mx = Math.max(1800, S.hole + 100), sy = (d: number) => 22 + (d / mx) * (H - 32), cx = W * 0.42;
  ([[0, 400, "#c9b26b"], [400, 900, "#7b6a58"], [900, 1300, "#a9a9a0"], [1300, 1800, "#b08a5a"], [1800, 9999, "#6a5a4a"]] as const).forEach((l) => { g.fillStyle = l[2]; g.fillRect(0, sy(l[0]), W, sy(Math.min(l[1], mx)) - sy(l[0])); });
  g.fillStyle = "#0e1a22"; g.fillRect(0, 0, W, 22);
  g.fillStyle = "#3a2a18"; g.fillRect(cx - 25, 22, 50, sy(S.hole) - 22);
  g.fillStyle = "#8c8c8c"; g.fillRect(cx - 29, 22, 4, sy(800) - 22); g.fillRect(cx + 25, 22, 4, sy(800) - 22);
  g.fillStyle = "#222"; g.fillRect(cx - 3, 22, 6, sy(S.bit) - 22);
  g.fillStyle = "#ff4a3d"; g.beginPath(); g.moveTo(cx - 7, sy(S.bit)); g.lineTo(cx + 7, sy(S.bit)); g.lineTo(cx, sy(S.bit) + 8); g.fill();
  if (S.fin > 0) { g.fillStyle = "#ffcc44"; const o = (S.t * 40) % 20; for (let y = 22 + o; y < sy(S.bit); y += 20) g.fillRect(cx - 1, y, 2, 6); for (let y = sy(S.bit) - o; y > 22; y -= 20) { g.fillRect(cx - 19, y, 2, 6); g.fillRect(cx + 15, y, 2, 6); } }
  if (S.influx > 0 || (S.bop && S.kick)) { g.fillStyle = "#ff3333"; for (let i = 0; i < 6; i++) g.fillRect(cx - 21 + i * 8, sy(S.hole) - ((S.t * 30 + i * 20) % 60), 5, 5); }
  g.fillStyle = "#fff"; g.font = "11px ui-sans-serif,system-ui"; g.textAlign = "left";
  g.fillText("Broca " + S.bit.toFixed(0) + " m", cx + 34, sy(S.bit)); g.fillText("Fundo " + S.hole.toFixed(0) + " m", cx + 34, sy(S.hole) + 14); g.fillText("Sapata 800 m", cx + 34, sy(800));
  g.fillStyle = S.bop ? "#ff5c5c" : "#5df08a"; g.font = "bold 11px ui-sans-serif"; g.fillText(S.bop ? "BOP FECHADO" : "BOP ABERTO", 6, 15);
}

export function drawLot(g: G, W: number, H: number) {
  const L = S.lot; g.clearRect(0, 0, W, H); g.fillStyle = "#081016"; g.fillRect(0, 0, W, H); g.strokeStyle = "#24333f"; g.strokeRect(0.5, 0.5, W - 1, H - 1);
  g.fillStyle = "#8fa3b3"; g.font = "600 11px ui-sans-serif"; g.textAlign = "left"; g.fillText("LOT: Pressão (psi) × Volume (bbl)", 6, 14);
  const px = (v: number) => (v / 4) * (W - 20) + 10, py = (p: number) => H - 10 - (p / 2500) * (H - 30);
  g.strokeStyle = "#ffcc44"; g.lineWidth = 2; g.beginPath(); L.pts.forEach((p, i) => (i ? g.lineTo(px(p[0]), py(p[1])) : g.moveTo(px(p[0]), py(p[1])))); g.stroke();
  if (L.leak) { g.fillStyle = "#ff5555"; g.beginPath(); g.arc(px(L.leak.vol), py(L.leak.p), 5, 0, 7); g.fill(); }
}

/** Compact driller screen used on the 3D monitors in the doghouse. */
export function drawMonitor(g: G, W: number, H: number, kind: number) {
  g.fillStyle = "#050a0e"; g.fillRect(0, 0, W, H);
  if (kind === 0) { drawGauges(g, W, H); }
  else if (kind === 1) { drawTrends(g, W, H, 6); }
  else {
    g.save(); drawWell(g, W * 0.4, H); g.restore();
    const rows: [string, number, string, number][] = [["WOB", S.wob, "klb", 0], ["ROP", S.rop, "m/h", 0], ["RPM", S.rpm, "", 0], ["SPM", S.spm, "", 0], ["SPP", S.spp, "psi", 0], ["DENS", S.dens, "ppg", 2], ["BLOCO", S.h, "m", 1], ["FUNDO", S.hole, "m", 1]];
    rows.forEach((r, i) => { const x = W * 0.43 + (i % 2) * W * 0.29, y = 18 + Math.floor(i / 2) * (H / 4.3);
      g.fillStyle = "#0c1820"; g.fillRect(x, y, W * 0.27, H / 4.8); g.fillStyle = "#7f97a8"; g.font = "600 13px ui-sans-serif"; g.textAlign = "left"; g.fillText(r[0], x + 6, y + 16);
      g.fillStyle = "#5df08a"; g.font = "bold 24px ui-monospace,monospace"; g.fillText(r[1].toFixed(r[3]), x + 6, y + 44); g.fillStyle = "#7f97a8"; g.font = "12px ui-sans-serif"; g.fillText(r[2], x + W * 0.2, y + 44); });
    if (S.al.length) { g.fillStyle = "#b3261e"; g.fillRect(W * 0.42, H - 30, W * 0.57, 26); g.fillStyle = "#fff"; g.font = "bold 13px ui-sans-serif"; g.fillText(S.al[0]!, W * 0.43, H - 12); }
  }
}
