import { useEffect, useRef, useState } from "react";
import { input, useGame } from "@/game/store";
import { interact, standUp } from "@/game/actions";

/** Mobile controls: floating joystick (left), look-drag area (right), sprint / interact / zoom buttons. */
export function TouchControls() {
  const [touch, setTouch] = useState(false);
  const { mode, prompt, paused } = useGame();
  const [sprint, setSprint] = useState(false);
  const joy = useRef<{ id: number; x: number; y: number } | null>(null), look = useRef<{ id: number; x: number; y: number } | null>(null);
  const [knob, setKnob] = useState<{ bx: number; by: number; kx: number; ky: number } | null>(null);
  useEffect(() => { setTouch(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window); }, []);
  useEffect(() => { input.sprint = sprint; }, [sprint]);
  if (!touch || paused) return null;
  const R = 56;
  return (
    <div className="absolute inset-0">
      {mode === "explore" && (
        <>
          <div className="absolute bottom-0 left-0 h-[55%] w-1/2"
            onPointerDown={(e) => { joy.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId); setKnob({ bx: e.clientX, by: e.clientY, kx: e.clientX, ky: e.clientY }); }}
            onPointerMove={(e) => { const j = joy.current; if (!j || j.id !== e.pointerId) return; let dx = e.clientX - j.x, dy = e.clientY - j.y; const l = Math.hypot(dx, dy); if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; } input.joyX = dx / R; input.joyY = -dy / R; input.sprint = sprint || l > R * 1.6; setKnob({ bx: j.x, by: j.y, kx: j.x + dx, ky: j.y + dy }); }}
            onPointerUp={() => { joy.current = null; input.joyX = 0; input.joyY = 0; input.sprint = sprint; setKnob(null); }}
            onPointerCancel={() => { joy.current = null; input.joyX = 0; input.joyY = 0; setKnob(null); }}>
            {!knob && <div className="hud-btn absolute bottom-10 left-10 grid h-32 w-32 place-items-center"><div className="h-14 w-14 rounded-full bg-foreground/40" /></div>}
            {knob && (
              <>
                <div className="hud-btn absolute h-32 w-32" style={{ left: knob.bx - 64, top: knob.by - 64 - (window.innerHeight * 0.45) }} />
                <div className="absolute h-14 w-14 rounded-full bg-primary/80" style={{ left: knob.kx - 28, top: knob.ky - 28 - (window.innerHeight * 0.45) }} />
              </>
            )}
          </div>
          <div className="absolute right-0 top-[20%] h-[80%] w-1/2"
            onPointerDown={(e) => { look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { const l = look.current; if (!l || l.id !== e.pointerId) return; input.yaw -= (e.clientX - l.x) * 0.006; input.pitch = Math.max(-0.35, Math.min(1.2, input.pitch + (e.clientY - l.y) * 0.004)); look.current = { ...l, x: e.clientX, y: e.clientY }; }}
            onPointerUp={() => { look.current = null; }} />
          <div className="absolute bottom-8 right-6 flex flex-col items-end gap-3">
            {prompt && (
              <button onClick={() => interact(prompt.id)} className="flex items-center gap-2 rounded-full bg-primary py-2 pl-2 pr-4 font-hud text-sm font-bold uppercase text-primary-foreground shadow-xl">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/20 text-lg">✋</span>{prompt.label}
              </button>
            )}
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-2">
                <button onClick={() => (input.dist = Math.max(2.2, input.dist - 1.5))} className="hud-btn h-11 w-11 font-hud text-lg">＋</button>
                <button onClick={() => (input.dist = Math.min(12, input.dist + 1.5))} className="hud-btn h-11 w-11 font-hud text-lg">－</button>
              </div>
              <button onClick={() => setSprint((s) => !s)} className={`hud-btn h-20 w-20 font-hud text-xs font-bold uppercase ${sprint ? "border-primary text-primary" : ""}`}>Correr</button>
            </div>
          </div>
        </>
      )}
      {mode === "seated" && (
        <button onClick={standUp} className="hud-btn absolute bottom-6 left-6 h-14 px-5 font-hud text-sm font-bold uppercase">Levantar</button>
      )}
    </div>
  );
}
