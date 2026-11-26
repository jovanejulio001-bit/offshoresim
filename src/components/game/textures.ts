import * as THREE from "three";
// Procedural canvas textures (generated once in the browser).
function make(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat = 1, color = true) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d")!; draw(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.anisotropy = 8; if (color) t.colorSpace = THREE.SRGBColorSpace; return t;
}
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function grime(g: CanvasRenderingContext2D, s: number, n: number, a: number) {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${40 + rnd() * 60},${30 + rnd() * 30},${20},${rnd() * a})`; const r = 0.5 + rnd() * s * 0.008; g.beginPath(); g.arc(rnd() * s, rnd() * s, r, 0, 7); g.fill(); }
}
const cache = new Map<string, THREE.Texture>();
const memo = (k: string, f: () => THREE.Texture) => { let t = cache.get(k); if (!t) { t = f(); cache.set(k, t); } return t; };

export const tex = {
  grating: () => memo("grating", () => make(256, (g, s) => {
    g.fillStyle = "#2a2d2f"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "#6b7177"; g.lineWidth = 5; for (let i = 0; i <= s; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); }
    g.lineWidth = 3; g.strokeStyle = "#565b60"; for (let i = 0; i <= s; i += 32) { g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
    grime(g, s, 300, 0.25);
  }, 30)),
  plate: () => memo("plate", () => make(256, (g, s) => {
    g.fillStyle = "#7d8287"; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 16) { g.save(); g.translate(x + ((y / 16) % 2) * 8 + 4, y + 8); g.rotate(((x + y) / 16) % 2 ? 0.8 : -0.8); g.fillStyle = "#9aa0a5"; g.fillRect(-5, -1.2, 10, 2.4); g.restore(); }
    grime(g, s, 500, 0.35); g.strokeStyle = "rgba(20,20,20,.4)"; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2);
  }, 8)),
  steel: () => memo("steel", () => make(256, (g, s) => {
    g.fillStyle = "#c9ccc8"; g.fillRect(0, 0, s, s); grime(g, s, 900, 0.3);
    for (let i = 0; i < 40; i++) { const x = rnd() * s, y = rnd() * s, l = 20 + rnd() * 60; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, "rgba(120,60,20,.35)"); gr.addColorStop(1, "rgba(120,60,20,0)"); g.fillStyle = gr; g.fillRect(x, y, 2 + rnd() * 3, l); }
  }, 1)),
  hazard: () => memo("hazard", () => make(128, (g, s) => {
    g.fillStyle = "#e8b10e"; g.fillRect(0, 0, s, s); g.fillStyle = "#151515";
    for (let i = -s; i < s * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 - s, s); g.lineTo(i - s, s); g.fill(); }
  }, 1)),
  container: () => memo("container", () => make(256, (g, s) => {
    g.fillStyle = "#fff"; g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 12) { const gr = g.createLinearGradient(x, 0, x + 12, 0); gr.addColorStop(0, "#d8d8d8"); gr.addColorStop(0.5, "#ffffff"); gr.addColorStop(1, "#b8b8b8"); g.fillStyle = gr; g.fillRect(x, 0, 12, s); }
    grime(g, s, 300, 0.25);
  }, 1)),
  flow: () => memo("flow", () => make(64, (g, s) => {
    g.fillStyle = "#3a2a16"; g.fillRect(0, 0, s, s); g.fillStyle = "#b8873f"; for (let i = 0; i < s; i += 16) g.fillRect(0, i, s, 6);
  }, 1)),
};
