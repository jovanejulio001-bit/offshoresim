import { useEffect, useRef } from "react";
import { S } from "@/game/sim";
import { player, input, useGame } from "@/game/store";
import { useTick } from "@/game/useTick";
import { interact } from "@/game/actions";
import { DECK, RIG, DOGHOUSE, interactables } from "@/game/world";

function Stat({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-hud text-sm sm:text-lg leading-none font-bold tabular-nums ${warn ? "text-destructive" : "text-foreground"}`}>{value}<span className="ml-1 text-[10px] font-medium text-muted-foreground">{unit}</span></div>
    </div>
  );
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current; if (!c) return; const g = c.getContext("2d")!; const W = c.width, H = c.height;
      const sx = (x: number) => ((x - DECK.x0) / (DECK.x1 - DECK.x0)) * W, sz = (z: number) => ((z - DECK.z0) / (DECK.z1 - DECK.z0)) * H;
      g.clearRect(0, 0, W, H); g.fillStyle = "rgba(30,60,80,.55)"; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(150,160,165,.55)"; g.fillRect(2, 2, W - 4, H - 4);
      const r = (x0: number, z0: number, x1: number, z1: number, c: string) => { g.fillStyle = c; g.fillRect(sx(x0), sz(z0), sx(x1) - sx(x0), sz(z1) - sz(z0)); };
      r(-27, -24, 27, -19, "#d9d7cf"); r(RIG.x0, RIG.z0, RIG.x1, RIG.z1, "#5d6468"); r(DOGHOUSE.x0, DOGHOUSE.z0, DOGHOUSE.x1, DOGHOUSE.z1, "#d7d9cf");
      r(-24, -11.6, -12, 2, "#3d6b4a"); r(-23, 11, -13, 17, "#2e5d8a"); r(-1, 17, 9, 23, "#e5a812"); r(17, -20, 23.5, -10, "#a04030");
      g.fillStyle = "#c8452a"; g.beginPath(); g.arc(sx(0), sz(0), 4, 0, 7); g.fill();
      g.fillStyle = "#ffd04a"; interactables.forEach((it) => { g.beginPath(); g.arc(sx(it.x), sz(it.z), 2, 0, 7); g.fill(); });
      // player arrow + view cone
      g.save(); g.translate(sx(player.x), sz(player.z));
      g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.moveTo(0, 0); const a = Math.atan2(-Math.sin(input.yaw), -Math.cos(input.yaw)); g.arc(0, 0, 26, Math.PI / 2 - a - 0.6, Math.PI / 2 - a + 0.6); g.fill();
      g.rotate(-player.heading + Math.PI); g.fillStyle = "#ff8a3d"; g.strokeStyle = "#fff"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke(); g.restore();
    }, 150);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={ref} width={150} height={134} className="block h-[100px] w-[112px] sm:h-[134px] sm:w-[150px]" />;
}

export function Hud() {
  useTick(120);
  const { mode, prompt, set, user, paused } = useGame();
  const alarm = S.al.length > 0;
  return (
    <div className="pointer-events-none absolute inset-0 font-sans text-foreground">
      {/* top-left: well status */}
      <div className="hud-panel absolute left-2 top-2 grid grid-cols-3 gap-x-2.5 gap-y-1.5 px-3 py-2 sm:left-3 sm:top-3 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-2 sm:px-4 sm:py-3">
        <Stat label="Broca" value={S.bit.toFixed(1)} unit="m" />
        <Stat label="Fundo" value={S.hole.toFixed(1)} unit="m" />
        <Stat label="ROP" value={S.rop.toFixed(0)} unit="m/h" />
        <Stat label="WOB" value={S.wob.toFixed(0)} unit="klb" warn={S.wob > 45} />
        <Stat label="RPM" value={S.rpm.toFixed(0)} unit="" />
        <Stat label="SPM" value={S.spm.toFixed(0)} unit="" />
        <Stat label="SPP" value={S.spp.toFixed(0)} unit="psi" warn={S.spp > 4000} />
        <Stat label="Bloco" value={S.h.toFixed(1)} unit="m" />
        <div className="col-span-3 flex gap-1.5 pt-1 sm:col-span-4">
          {[["BOMBAS", S.pumpOn], ["ROTAÇÃO", S.rotOn], ["CUNHAS", S.slips], ["BOP", S.bop]].map(([l, on]) => (
            <span key={l as string} className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${on ? "bg-success/25 text-success" : "bg-muted text-muted-foreground"}`}>{l}</span>
          ))}
        </div>
      </div>
      {/* top-right: minimap + menu buttons */}
      <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex flex-col items-end gap-2">
        <div className="hud-panel p-1.5"><Minimap /></div>
        <div className="pointer-events-auto flex gap-2">
          <button onClick={() => set({ account: true })} className="hud-panel px-3 py-1.5 font-hud text-xs font-semibold uppercase tracking-wider hover:text-primary">{user ? "Conta ✓" : "Conta"}</button>
          <button onClick={() => set({ paused: !paused })} aria-label="Pausa" className="hud-panel px-3 py-1.5 font-hud text-xs font-semibold uppercase tracking-wider hover:text-primary">❚❚</button>
        </div>
      </div>
      {/* alarms */}
      {alarm && (
        <div className="absolute left-1/2 top-3 hidden -translate-x-1/2 animate-pulse rounded-sm bg-destructive/90 px-5 py-2 font-hud text-sm font-bold tracking-wider text-destructive-foreground shadow-lg md:block">
          ⚠ {S.al.join("  ·  ")}
        </div>
      )}
      {alarm && <div className="absolute inset-x-3 top-[118px] rounded-sm bg-destructive/90 px-3 py-1.5 text-center font-hud text-xs font-bold md:hidden">⚠ {S.al[0]}</div>}
      {/* toast */}
      {S.msgT > 0 && (
        <div className="absolute left-1/2 top-[22%] max-w-[90vw] -translate-x-1/2 rounded-sm border-l-4 border-primary bg-card px-4 py-2 text-center text-sm font-medium shadow-xl backdrop-blur">{S.msg}</div>
      )}
      {/* contextual interaction prompt (desktop) */}
      {mode === "explore" && prompt && (
        <button onClick={() => interact(prompt.id)} className="pointer-events-auto absolute bottom-[18%] left-1/2 hidden -translate-x-1/2 items-center gap-3 hud-panel py-2 pl-2 pr-4 md:flex">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary font-hud text-base font-bold text-primary-foreground">E</span>
          <span className="font-hud text-sm font-semibold uppercase tracking-wide">{prompt.label}</span>
        </button>
      )}
      {/* crosshair dot */}
      {mode === "explore" && <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" />}
      {/* keyboard hints (desktop) */}
      {mode === "explore" && (
        <div className="absolute bottom-3 left-3 hidden gap-2 text-[11px] text-foreground/80 md:flex">
          {[["WASD", "Mover"], ["Shift", "Correr"], ["Rato", "Câmara"], ["Roda", "Zoom"], ["E", "Interagir"], ["Esc", "Pausa"]].map(([k, l]) => (
            <span key={k} className="hud-panel flex items-center gap-1.5 px-2 py-1"><b className="font-hud text-primary">{k}</b>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
