// Drilling simulation engine (ported from the original sim.js). Pure TS: no React, no three.js.
// Every control, HUD and 3D animation reads/writes the single state object S.
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mv = (v: number, t: number, d: number) => v + clamp(t - v, -d, d);

export type HistKey = "wob" | "rop" | "rpm" | "tq" | "hook" | "spp" | "fin" | "fout" | "pit" | "dens" | "depth";
export interface LotResult { p: number; vol: number; emw: number }
export interface SimState {
  pumpOn: number; spmT: number; spm: number; rotOn: number; rpmT: number; rpm: number;
  lever: number; vel: number; h: number; slips: number; needConn: number; elevClosed: number; conn: number;
  bit: number; hole: number; anchor: number; dens: number; densT: number; pit: number; pit0: number; pore: number;
  kick: number; bop: number; influx: number; wob: number; rop: number; tq: number; hook: number; spp: number;
  fin: number; fout: number; casP: number; chk: number; annP: number; hydro: number; t: number;
  al: string[]; msg: string; msgT: number; hT: number; rotAngle: number; pumpPhase: number;
  lot: { on: number; pump: number; vol: number; p: number; leak: { p: number; vol: number } | null; pts: [number, number][]; res: LotResult[] };
  hist: Record<HistKey, number[]>;
  stats: { conn: number; drilled: number; kicks: number };
}

export function createSim(): SimState {
  const hist = {} as Record<HistKey, number[]>;
  (["wob", "rop", "rpm", "tq", "hook", "spp", "fin", "fout", "pit", "dens", "depth"] as HistKey[]).forEach((k) => (hist[k] = []));
  return {
    pumpOn: 0, spmT: 60, spm: 0, rotOn: 0, rpmT: 80, rpm: 0, lever: 0, vel: 0, h: 28, slips: 0, needConn: 0, elevClosed: 1, conn: 0,
    bit: 1500, hole: 1520, anchor: 1528, dens: 9.6, densT: 9.6, pit: 400, pit0: 400, pore: 8.8, kick: 0, bop: 0, influx: 0,
    wob: 0, rop: 0, tq: 0, hook: 0, spp: 0, fin: 0, fout: 0, casP: 0, chk: 0, annP: 0, hydro: 0, t: 0,
    al: [], msg: "", msgT: 0, hT: 0, rotAngle: 0, pumpPhase: 0,
    lot: { on: 0, pump: 0, vol: 0, p: 0, leak: null, pts: [], res: [] }, hist, stats: { conn: 0, drilled: 0, kicks: 0 },
  };
}

export const S: SimState = createSim();

export function msg(t: string) { S.msg = t; S.msgT = 4; }

export function step(dt: number) {
  S.t += dt; const L = S.lot;
  S.spm = mv(S.spm, S.pumpOn && !L.on ? S.spmT : 0, 30 * dt);
  if (S.rotOn && (S.spm < 20 || S.slips)) { S.rotOn = 0; msg("Rotação desligada: sem circulação ou cunhas ativas"); }
  S.rpm = mv(S.rpm, S.rotOn ? S.rpmT : 0, 40 * dt);
  S.rotAngle += (S.rpm / 60) * Math.PI * 2 * dt;
  S.pumpPhase += (S.spm / 60) * Math.PI * 2 * dt;
  // physical lever -> Top Drive speed (accel/decel + interlocks)
  let tv = S.lever * 2;
  if (S.wob > 45 && tv < 0) tv = 0;
  if ((S.h >= 28 && tv > 0) || (S.h <= 0 && tv < 0)) tv = 0;
  S.vel = mv(S.vel, tv, (Math.abs(tv) > Math.abs(S.vel) ? 1.5 : 3) * dt);
  S.h = clamp(S.h + S.vel * dt, 0, 28);
  if ((S.h <= 0 && S.vel < 0) || (S.h >= 28 && S.vel > 0)) S.vel = 0;
  // Top Drive -> block -> string -> bit
  const raw = S.slips ? S.bit : S.anchor - S.h, over = S.slips ? 0 : Math.max(0, raw - S.hole);
  if (!S.slips) S.bit = Math.min(raw, S.hole);
  S.wob = clamp(over * 30, 0, 60);
  S.rop = S.wob > 1 && S.rpm > 10 && S.spm > 20 ? 0.02 * S.wob * S.rpm * (1.3 - S.hole / 4000) : 0;
  const dd = (S.rop / 3600) * 15 * dt; S.hole += dd; S.stats.drilled += dd;
  S.hook = 60 + (S.slips ? 0 : S.bit * 0.12 - S.wob);
  S.tq = S.rpm > 5 ? 3 + S.wob * 0.25 + S.rpm / 60 : 0;
  // pumps -> flow -> pressure
  S.dens = mv(S.dens, S.densT, 0.05 * dt);
  S.fin = S.spm * 4.2;
  S.spp = S.fin > 0 ? 140 * Math.pow(S.fin / 100, 1.85) * (0.5 + S.bit / 2000) * (S.dens / 10) : 0;
  S.hydro = 0.052 * S.dens * S.bit;
  const dP = 0.052 * (S.pore - S.dens) * S.hole;
  S.influx = S.kick && !S.bop && !L.on ? Math.max(0, S.pore - S.dens) * 12 : 0;
  S.pit += (S.influx * dt) / 60;
  if (S.kick && S.bop) S.casP = mv(S.casP, Math.max(0, dP), 150 * dt); else S.casP = mv(S.casP, 0, 300 * dt);
  if (S.kick && S.dens >= S.pore + 0.1 && !S.bop && S.influx === 0) { S.kick = 0; S.pore = 8.8; S.pit0 = S.pit; msg("Poço controlado: kick circulado e neutralizado"); }
  S.fout = S.bop ? 0 : S.fin * 0.98 + S.influx * 42;
  S.chk = S.bop ? S.casP * 0.9 : 0;
  S.annP = S.hydro * 0.98 + S.fin * 0.3 + S.casP;
  if (L.on) {
    if (L.pump) L.vol += 0.4 * dt; else if (L.leak) L.vol = Math.max(0, L.vol - 0.01 * dt);
    const k = 220, pl = 1700 + S.hole * 0.1, vl = pl / k;
    L.p = L.vol < vl ? L.vol * k : pl + (L.vol - vl) * 30;
    if (L.pump && L.pts.length < 2000) L.pts.push([L.vol, L.p]);
    if (!L.leak && L.vol > vl + 0.12) { L.leak = { p: pl, vol: vl }; msg("Leak-off detectado a " + pl.toFixed(0) + " psi"); }
    S.casP = L.p;
  }
  if (S.conn > 0) { S.conn -= dt; if (S.conn <= 0) { S.conn = 0; S.needConn = 0; S.stats.conn++; msg("Tubo conectado. Levante o Top Drive e solte as cunhas"); } }
  const a: string[] = [];
  if (S.pit - S.pit0 > 5) a.push("GANHO NO TANQUE +" + (S.pit - S.pit0).toFixed(1) + " bbl");
  if (S.spm > 0 && S.fout > S.fin + 25) a.push("FLOW OUT > FLOW IN");
  if (S.spm < 5 && S.fout > 20) a.push("POÇO FLUINDO COM BOMBAS PARADAS");
  if (S.spp > 4000) a.push("SPP ALTA");
  if (S.casP > 3500) a.push("PRESSÃO DE CASING ALTA");
  if (S.wob > 45) a.push("WOB EXCESSIVO");
  S.al = a;
  if (S.msgT > 0) S.msgT -= dt;
  S.hT += dt;
  if (S.hT >= 0.25) {
    S.hT = 0; const H = S.hist;
    const v: Record<HistKey, number> = { wob: S.wob, rop: S.rop, rpm: S.rpm, tq: S.tq, hook: S.hook, spp: S.spp, fin: S.fin, fout: S.fout, pit: S.pit, dens: S.dens, depth: S.bit };
    (Object.keys(v) as HistKey[]).forEach((k) => { H[k].push(v[k]); if (H[k].length > 120) H[k].shift(); });
  }
}

export function opPump() { S.pumpOn = S.pumpOn ? 0 : 1; msg(S.pumpOn ? "Bombas de lama ligadas" : "Bombas de lama desligadas"); }
export function opRot() {
  if (S.slips) return msg("Cunhas ativas: não pode rodar");
  if (!S.rotOn && S.spm < 20) return msg("Ligue as bombas antes de rodar");
  S.rotOn = S.rotOn ? 0 : 1;
}
export function opSlips() {
  if (S.slips) {
    if (S.needConn) return msg("Conecte o tubo antes de soltar as cunhas");
    if (S.h < 27) return msg("Levante o Top Drive até ao topo antes de soltar as cunhas");
    S.slips = 0; S.anchor = S.bit + S.h; msg("Cunhas soltas");
  } else {
    if (Math.abs(S.vel) > 0.05 || S.rpm > 5) return msg("Pare a coluna e a rotação antes de assentar as cunhas");
    S.slips = 1; if (S.h < 2) S.needConn = 1; msg("Cunhas assentadas: coluna presa");
  }
}
export function opConnect() {
  if (!S.slips || S.h > 2 || !S.needConn) return msg("Assente as cunhas com o Top Drive em baixo");
  if (S.elevClosed) return msg("Abra os elevadores primeiro");
  if (S.conn <= 0) S.conn = 4;
}
export function opElev() { if (Math.abs(S.vel) > 0.05) return msg("Pare o Top Drive"); S.elevClosed = S.elevClosed ? 0 : 1; msg(S.elevClosed ? "Elevadores fechados" : "Elevadores abertos"); }
export function opKick() { if (S.kick) return; S.kick = 1; S.pore = S.dens + 0.8; S.stats.kicks++; msg("Atenção: influxo da formação iniciado"); }
export function opBop() { S.bop = S.bop ? 0 : 1; msg(S.bop ? "BOP fechado: poço fechado" : "BOP aberto"); }
export function opLot() {
  const L = S.lot;
  if (L.on) { L.on = 0; L.pump = 0; L.vol = 0; L.p = 0; L.leak = null; L.pts = []; return msg("LOT terminado"); }
  if (S.spm > 1 || S.rpm > 1) return msg("Pare bombas e rotação para o LOT");
  L.on = 1; L.vol = 0; L.leak = null; L.pts = []; msg('LOT iniciado: mantenha "Bombear" premido');
}
export function opLotRecord() {
  const L = S.lot; if (!L.on || !L.leak) return msg("Ainda sem leak-off detectado");
  L.res.push({ p: L.leak.p, vol: L.leak.vol, emw: S.dens + L.leak.p / (0.052 * 800) }); msg("Resultado LOT registado");
}
/** Barite added at the mixing hopper raises target density. */
export function opAddBarite() { S.densT = clamp(S.densT + 0.2, 8.5, 13); msg("Barite adicionada: densidade alvo " + S.densT.toFixed(2) + " ppg"); }
