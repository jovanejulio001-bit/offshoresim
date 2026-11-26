import { useEffect, useRef, useState, type ReactNode } from "react";
import { S, clamp, opBop, opConnect, opElev, opKick, opLot, opLotRecord, opPump, opRot, opSlips } from "@/game/sim";
import { drawGauges, drawLot, drawTrends, drawWell } from "@/game/draw";
import { input, useGame } from "@/game/store";
import { useTick } from "@/game/useTick";
import { standUp } from "@/game/actions";

function LiveCanvas({ w, h, draw, className }: { w: number; h: number; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { let raf = 0, last = 0; const loop = (t: number) => { raf = requestAnimationFrame(loop); if (t - last < 66) return; last = t; const g = ref.current?.getContext("2d"); if (g) draw(g, w, h); }; raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf); }, [draw, w, h]);
  return <canvas ref={ref} width={w} height={h} className={className ?? "w-full rounded-sm bg-[#050a0e]"} />;
}

function Toggle({ on, onClick, children, danger }: { on: boolean; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`relative rounded-sm border px-2.5 py-2 text-left font-hud text-xs font-bold uppercase tracking-wide transition-colors ${on ? (danger ? "border-destructive bg-destructive/25 text-destructive" : "border-success bg-success/20 text-success") : "border-border bg-secondary/70 text-foreground hover:border-primary"}`}>
      <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ${on ? (danger ? "bg-destructive" : "bg-success") : "bg-muted-foreground/40"}`} />{children}
    </button>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-background/50 p-2.5">
      <h4 className="mb-2 font-hud text-[11px] font-bold uppercase tracking-[0.15em] text-primary">{title}</h4>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}
function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="grid gap-1 text-[11px] text-muted-foreground">
      <span className="flex justify-between"><span>{label}</span><b className="font-hud text-foreground">{fmt ? fmt(value) : value}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="accent-primary" />
    </label>
  );
}

/** Large physical-style lever: drag up = raise Top Drive, down = lower, release = spring to neutral. */
function Lever() {
  const track = useRef<HTMLDivElement>(null), dragging = useRef(false);
  const setFrom = (y: number) => { const r = track.current!.getBoundingClientRect(); let v = clamp((r.top + r.height / 2 - y) / (r.height / 2 - 22), -1, 1); if (Math.abs(v) < 0.08) v = 0; S.lever = v; input.leverKey = 0; };
  const pos = S.lever;
  return (
    <div className="hud-panel flex items-center gap-3 p-3">
      <div ref={track} className="relative h-56 w-16 cursor-grab touch-none rounded-full border border-border bg-[linear-gradient(180deg,oklch(0.78_0.18_150/.25),oklch(0.2_0.02_240)_45%,oklch(0.2_0.02_240)_55%,oklch(0.62_0.23_27/.25))]"
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setFrom(e.clientY); }}
        onPointerMove={(e) => dragging.current && setFrom(e.clientY)}
        onPointerUp={() => { dragging.current = false; S.lever = 0; }} onPointerCancel={() => { dragging.current = false; S.lever = 0; }}>
        <div className="absolute inset-x-2 top-1/2 h-px bg-foreground/40" />
        <div className="absolute left-1/2 h-11 w-11 -translate-x-1/2 rounded-full border-2 border-white/60 bg-[radial-gradient(circle_at_35%_30%,#ff8a80,#c62828_60%,#7f1010)] shadow-xl" style={{ top: `calc(50% - 22px - ${pos * 84}px)` }} />
      </div>
      <div className="grid gap-1 font-hud text-xs">
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Alavanca Top Drive</div>
        <div className="text-base font-bold">{Math.abs(S.vel) < 0.02 ? "NEUTRO" : S.vel > 0 ? "▲ A SUBIR" : "▼ A DESCER"}</div>
        <div className="text-muted-foreground">Posição <b className="text-foreground">{(S.lever * 100).toFixed(0)}%</b></div>
        <div className="text-muted-foreground">Velocidade <b className="text-foreground">{S.vel.toFixed(2)} m/s</b></div>
        <div className="text-muted-foreground">Altura bloco <b className="text-foreground">{S.h.toFixed(1)} m</b></div>
        <div className="mt-1 h-2 w-36 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(S.h / 28) * 100}%` }} /></div>
        <div className="mt-1 hidden text-[10px] text-muted-foreground md:block">W / S ou arraste · solte = neutro</div>
      </div>
    </div>
  );
}

const DIG: [string, () => number, string, number][] = [
  ["WOB", () => S.wob, "klb", 0], ["ROP", () => S.rop, "m/h", 0], ["RPM", () => S.rpm, "", 0], ["Torque", () => S.tq, "kft-lb", 1],
  ["Hook", () => S.hook, "klb", 0], ["SPP", () => S.spp, "psi", 0], ["Flow In", () => S.fin, "gpm", 0], ["Flow Out", () => S.fout, "gpm", 0],
  ["Pit Vol", () => S.pit, "bbl", 1], ["Densidade", () => S.dens, "ppg", 2], ["Hidrostática", () => S.hydro, "psi", 0], ["Influxo", () => S.influx, "bbl/min", 1],
];

export function DrillerConsole() {
  useTick(100);
  const mode = useGame((s) => s.mode);
  const [tab, setTab] = useState<"op" | "tr" | "well">("op");
  const [, force] = useState(0);
  const [hidden, setHidden] = useState(false);
  if (mode !== "seated") return null;
  const L = S.lot;
  const re = () => force((n) => n + 1);
  return (
    <div className="pointer-events-none absolute inset-0 text-foreground">
      <div className="pointer-events-auto absolute bottom-4 left-4 hidden md:block"><Lever /></div>
      <div className={`pointer-events-auto absolute inset-x-0 bottom-0 max-h-[62vh] overflow-y-auto border-t border-border bg-background/90 backdrop-blur md:inset-y-3 md:left-auto md:right-3 md:max-h-none md:w-[min(600px,46vw)] md:rounded-sm md:border ${hidden ? "md:bottom-auto max-h-12 md:max-h-12 overflow-hidden" : ""}`}>
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2">
          <b className="font-hud text-sm tracking-[0.2em] text-primary">PAINEL DO DRILLER</b>
          <span className={`ml-2 truncate rounded-sm px-2 py-0.5 text-[10px] font-bold ${S.al.length ? "bg-destructive text-destructive-foreground" : S.conn > 0 ? "bg-warning/30 text-warning" : "bg-success/20 text-success"}`}>{S.al[0] ?? (S.conn > 0 ? "A CONECTAR TUBO…" : "OPERAÇÃO NORMAL")}</span>
          <button onClick={() => setHidden((h) => !h)} className="ml-auto rounded-sm border border-border px-2 py-1 font-hud text-xs hover:border-primary">{hidden ? "Mostrar" : "Ocultar"}</button>
          <button onClick={standUp} className=" rounded-sm border border-border px-2 py-1 font-hud text-xs hover:border-primary">Levantar (E)</button>
        </div>
        <div className="flex gap-1 px-3 pt-2">
          {([["op", "Operação"], ["tr", "Tendências"], ["well", "Poço & LOT"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-t-sm px-3 py-1.5 font-hud text-xs font-bold uppercase tracking-wide ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-2 p-3">
          <div className="md:hidden"><Lever /></div>
          {tab === "op" && (
            <>
              <LiveCanvas w={600} h={250} draw={drawGauges} />
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {DIG.map(([l, f, u, d]) => (
                  <div key={l} className="rounded-sm border border-border bg-[#050a0e] px-2 py-1">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{l}</div>
                    <div className="font-hud text-base font-bold text-success tabular-nums">{f().toFixed(d)} <span className="text-[9px] text-muted-foreground">{u}</span></div>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Section title="Bombas de lama">
                  <Toggle on={!!S.pumpOn} onClick={() => { opPump(); re(); }}>Bombas {S.pumpOn ? "ON" : "OFF"}</Toggle>
                  <Slider label="SPM alvo" value={S.spmT} min={0} max={120} step={1} onChange={(v) => { S.spmT = v; re(); }} />
                </Section>
                <Section title="Top Drive">
                  <Toggle on={!!S.rotOn} onClick={() => { opRot(); re(); }}>Rotação {S.rotOn ? "ON" : "OFF"}</Toggle>
                  <Slider label="RPM alvo" value={S.rpmT} min={0} max={150} step={1} onChange={(v) => { S.rpmT = v; re(); }} />
                  <div className="text-[10px] text-muted-foreground">Sentido horário · Torque {S.tq.toFixed(1)} kft-lb</div>
                </Section>
                <Section title="Manuseio de tubos">
                  <Toggle on={!!S.slips} onClick={() => { opSlips(); re(); }}>Cunhas {S.slips ? "ASSENTADAS" : "SOLTAS"}</Toggle>
                  <Toggle on={!S.elevClosed} onClick={() => { opElev(); re(); }}>Elevadores {S.elevClosed ? "FECHADOS" : "ABERTOS"}</Toggle>
                  <Toggle on={S.conn > 0} onClick={() => { opConnect(); re(); }}>{S.conn > 0 ? `A conectar… ${S.conn.toFixed(1)}s` : "Conectar tubo"}</Toggle>
                </Section>
                <Section title="Lama & controlo de poço">
                  <Slider label="Densidade alvo (ppg)" value={S.densT} min={8.5} max={13} step={0.05} fmt={(v) => v.toFixed(2)} onChange={(v) => { S.densT = v; re(); }} />
                  <div className="grid grid-cols-2 gap-2">
                    <Toggle on={!!S.kick} danger onClick={() => { opKick(); re(); }}>Simular kick</Toggle>
                    <Toggle on={!!S.bop} danger onClick={() => { opBop(); re(); }}>BOP {S.bop ? "FECHADO" : "ABERTO"}</Toggle>
                  </div>
                </Section>
              </div>
            </>
          )}
          {tab === "tr" && <LiveCanvas w={600} h={720} draw={drawTrends} />}
          {tab === "well" && (
            <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
              <LiveCanvas w={220} h={420} draw={drawWell} />
              <div className="grid content-start gap-2">
                <LiveCanvas w={400} h={200} draw={drawLot} />
                <Section title="Leak-Off Test">
                  <div className="grid grid-cols-3 gap-2">
                    <Toggle on={!!L.on} onClick={() => { opLot(); re(); }}>{L.on ? "Terminar" : "Iniciar LOT"}</Toggle>
                    <button className={`rounded-sm border px-2 py-2 font-hud text-xs font-bold uppercase ${L.pump ? "border-warning bg-warning/25 text-warning" : "border-border bg-secondary/70"}`}
                      onPointerDown={() => (S.lot.pump = 1)} onPointerUp={() => (S.lot.pump = 0)} onPointerLeave={() => (S.lot.pump = 0)}>Bombear (premir)</button>
                    <Toggle on={false} onClick={() => { opLotRecord(); re(); }}>Registar</Toggle>
                  </div>
                  <div className="font-hud text-xs text-muted-foreground">
                    {L.on && <div>LOT: <b className="text-foreground">{L.p.toFixed(0)} psi</b> · {L.vol.toFixed(2)} bbl {L.leak && <b className="text-destructive">· LEAK-OFF</b>}</div>}
                    {L.res.map((r, i) => <div key={i}>#{i + 1}: {r.p.toFixed(0)} psi · {r.vol.toFixed(2)} bbl · EMW {r.emw.toFixed(2)} ppg</div>)}
                  </div>
                </Section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
