import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Character, type Anim, type Pose } from "./Character";
import { S } from "@/game/sim";
import { FLOOR_Y as F, groundAt } from "@/game/world";

type Step = { go: [number, number] } | { do: Anim; t: number; face?: number };
interface Brain { steps: Step[]; i: number; timer: number; y?: number; override?: () => Step | null }

function useWorker(start: [number, number], brain: Brain) {
  const pose = useRef<Pose>({ x: start[0], y: brain.y ?? groundAt(start[0], start[1]), z: start[1], heading: 0, anim: "idle", speed: 0 });
  const b = useRef(brain);
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05), p = pose.current, br = b.current;
    const step = br.override?.() ?? br.steps[br.i % br.steps.length]!;
    if ("go" in step) {
      const dx = step.go[0] - p.x, dz = step.go[1] - p.z, dist = Math.hypot(dx, dz);
      if (dist < 0.15) { if (!br.override?.()) { br.i++; br.timer = 0; } p.speed = 0; p.anim = "idle"; return; }
      const sp = 1.7; p.heading = Math.atan2(dx, dz); p.speed = sp; p.anim = "walk";
      p.x += (dx / dist) * Math.min(dist, sp * dt); p.z += (dz / dist) * Math.min(dist, sp * dt);
      if (br.y === undefined) p.y = groundAt(p.x, p.z);
    } else {
      p.anim = step.do; p.speed = 0; if (step.face !== undefined) p.heading = step.face;
      br.timer += dt; if (br.timer > step.t && !br.override?.()) { br.i++; br.timer = 0; }
    }
  });
  return pose;
}

/** Operational crew: roughnecks (pipe connections), derrickman (monkey board), mud engineer, deck crew. */
export function Workers() {
  const rnA = useWorker([-2.2, 2.6], { steps: [{ do: "idle", t: 6, face: Math.PI }, { go: [-1.0, 1.2] }, { do: "inspect", t: 4, face: Math.PI / 2 }, { go: [-2.2, 2.6] }], i: 0, timer: 0,
    override: () => (S.conn > 0 ? { do: "wrench", t: 99, face: Math.PI / 2 } : null) });
  const rnB = useWorker([2.0, -2.4], { steps: [{ do: "idle", t: 5, face: 0 }, { go: [3.2, 2.6] }, { do: "operate", t: 5, face: Math.PI }, { go: [2.0, -2.4] }], i: 0, timer: 0,
    override: () => (S.conn > 0 ? { do: "wrench", t: 99, face: -Math.PI / 2 } : null) });
  const derrickman = useWorker([0.6, -3.5], { y: F + 24.08, steps: [{ do: "idle", t: 4, face: 0 }, { do: "rack", t: 5, face: 0 }, { do: "inspect", t: 3, face: Math.PI }], i: 0, timer: 0,
    override: () => (Math.abs(S.vel) > 0.1 ? { do: "rack", t: 99, face: 0 } : null) });
  const mud = useWorker([-11.4, -8], { steps: [{ do: "inspect", t: 5, face: -Math.PI / 2 }, { go: [-11.4, -1] }, { go: [-6.8, -0.5] }, { do: "inspect", t: 5, face: -Math.PI / 2 }, { go: [-11.6, -1] }, { go: [-11.9, -5] }, { do: "operate", t: 4, face: -Math.PI / 2 }, { go: [-11.4, -8] }], i: 0, timer: 0 });
  const deck = useWorker([6, 14.5], { steps: [{ do: "inspect", t: 4, face: 0 }, { go: [12, 6] }, { go: [-6, 6.5] }, { go: [-10, 10] }, { do: "idle", t: 3, face: Math.PI }, { go: [6, 14.5] }], i: 0, timer: 0 });
  const pumpman = useWorker([-17, 19.5], { steps: [{ do: "inspect", t: 6, face: Math.PI }, { go: [-11.5, 19.5] }, { do: "operate", t: 4, face: Math.PI }, { go: [-17, 19.5] }], i: 0, timer: 0 });
  const crane = useWorker([17.5, 6.5], { steps: [{ do: "wave", t: 3, face: Math.PI }, { do: "idle", t: 7, face: -Math.PI / 2 }], i: 0, timer: 0 });
  const ad = useWorker([13.6, 1.8], { y: F, steps: [{ do: "operate", t: 8, face: Math.PI / 2 }, { do: "idle", t: 5, face: Math.PI / 2 }], i: 0, timer: 0 });
  return (
    <>
      <Character pose={rnA} suit="#e2611d" />
      <Character pose={rnB} suit="#e2611d" hat="#ffd21a" />
      <Character pose={derrickman} suit="#2a5ca8" hat="#ffd21a" />
      <Character pose={mud} suit="#f2f2ee" hat="#2b8be0" />
      <Character pose={deck} suit="#1f8a5b" />
      <Character pose={pumpman} suit="#e2611d" hat="#ffd21a" />
      <Character pose={crane} suit="#2a5ca8" />
      <Character pose={ad} suit="#26323b" hat="#ffffff" />
    </>
  );
}
