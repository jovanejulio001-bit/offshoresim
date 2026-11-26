import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Character, type Pose } from "./Character";
import { input, player, useGame } from "@/game/store";
import { S, step } from "@/game/sim";
import { CHAIR, FLOOR_Y as F, DOGHOUSE as DH, colliders, insideDoghouse, nearestInteractable, tryMove, groundAt } from "@/game/world";

const WALK = 2.6, RUN = 5.8;
const tmp = new THREE.Vector3(), look = new THREE.Vector3();

function camBlocked(x: number, y: number, z: number) {
  for (const c of colliders) { if (c.when && !c.when()) continue; if (x > c.x0 - 0.2 && x < c.x1 + 0.2 && z > c.z0 - 0.2 && z < c.z1 + 0.2 && y > c.y0 && y < c.y1 + 0.2) return true; }
  return y < groundAt(x, z) + 0.2;
}

/** The single stepper: sim -> player -> interactions -> camera, in that order every frame. */
export function PlayerRig() {
  const pose = useRef<Pose>({ x: player.x, y: player.y, z: player.z, heading: player.heading, anim: "idle", speed: 0 });
  const { camera } = useThree();
  const camDist = useRef(input.dist), seatBlend = useRef(0), lastPrompt = useRef<string | null>(null);
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05), ui = useGame.getState();
    if (ui.paused) return;
    // seated lever via keyboard (spring back to neutral when released)
    if (ui.mode === "seated" && input.leverKey !== 0) S.lever = input.leverKey;
    step(dt);
    const p = pose.current;
    if (ui.mode === "explore") {
      let mx = 0, mz = 0; const k = input.keys;
      const fy = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) + input.joyY;
      const rx = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) + input.joyX;
      const fx = -Math.sin(input.yaw), fz = -Math.cos(input.yaw);
      mx = fx * fy + -fz * rx; mz = fz * fy + fx * rx;
      const mag = Math.min(1, Math.hypot(mx, mz));
      const sprint = input.sprint || k.has("ShiftLeft") || k.has("ShiftRight");
      const target = mag > 0.05 ? (sprint ? RUN : WALK) * mag : 0;
      player.speed += (target - player.speed) * Math.min(1, dt * (target > player.speed ? 6 : 10));
      if (mag > 0.05) { player.heading = Math.atan2(mx, mz); const n = Math.hypot(mx, mz); tryMove(player, (mx / n) * player.speed * dt, (mz / n) * player.speed * dt); }
      else if (player.speed > 0.05) { tryMove(player, Math.sin(player.heading) * player.speed * dt, Math.cos(player.heading) * player.speed * dt); }
      p.x = player.x; p.y = player.y; p.z = player.z; p.heading = player.heading; p.speed = player.speed;
      p.anim = player.speed < 0.25 ? "idle" : player.speed > 3.8 ? "run" : "walk";
      const it = nearestInteractable(player.x, player.y, player.z);
      const key = it ? it.id + it.label() : null;
      if (key !== lastPrompt.current) { lastPrompt.current = key; ui.set({ prompt: it ? { id: it.id, label: it.label() } : null }); }
      seatBlend.current = Math.max(0, seatBlend.current - dt * 1.5);
    } else {
      p.x = CHAIR.x + 0.08; p.z = CHAIR.z; p.y = F; p.heading = -Math.PI / 2; p.anim = "sit"; p.speed = 0;
      player.x = CHAIR.x; player.z = CHAIR.z; player.y = F;
      if (lastPrompt.current) { lastPrompt.current = null; ui.set({ prompt: null }); }
      seatBlend.current = Math.min(1, seatBlend.current + dt * 2.5);
    }
    // third-person camera with independent orbit, zoom and wall avoidance
    const inside = insideDoghouse(player.x, player.z, player.y);
    const want = inside ? Math.min(input.dist, 2.4) : input.dist;
    const hx = player.x, hy = player.y + 1.55, hz = player.z;
    const cp = Math.cos(input.pitch), dir = tmp.set(Math.sin(input.yaw) * cp, Math.sin(input.pitch), Math.cos(input.yaw) * cp);
    let dist = want;
    for (let t = 0.4; t <= want; t += 0.2) { if (camBlocked(hx + dir.x * t, hy + dir.y * t, hz + dir.z * t)) { dist = Math.max(0.5, t - 0.3); break; } }
    camDist.current += (dist - camDist.current) * Math.min(1, dt * (dist < camDist.current ? 20 : 5));
    let cx = hx + dir.x * camDist.current + Math.cos(input.yaw) * 0.45, cy = hy + dir.y * camDist.current, cz = hz + dir.z * camDist.current - Math.sin(input.yaw) * 0.45;
    if (inside) { cx = Math.min(Math.max(cx, DH.x0 + 0.35), DH.x1 - 0.35); cz = Math.min(Math.max(cz, DH.z0 + 0.35), DH.z1 - 0.35); cy = Math.min(cy, F + DH.h - 0.25); }
    look.set(hx + Math.cos(input.yaw) * 0.45, hy, hz - Math.sin(input.yaw) * 0.45);
    // seated driller POV: eye position looking through the window at the derrick
    const s = seatBlend.current, e = s * s * (3 - 2 * s);
    if (e > 0) {
      const ex = CHAIR.x - 0.05, ey = F + 1.45, ez = CHAIR.z;
      const sy = input.yaw - Math.PI * 0.5; // small free-look around the console
      const lx = ex - 8, ly = F + 1.5 + S.h * 0.06, lz = ez + 1.0 + Math.sin(sy) * 0;
      cx += (ex - cx) * e; cy += (ey - cy) * e; cz += (ez - cz) * e;
      look.x += (lx - look.x) * e; look.y += (ly - look.y) * e; look.z += (lz - look.z) * e;
    }
    camera.position.set(cx, cy, cz); camera.lookAt(look);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>)["__cam"] = [cx, cy, cz, look.x, look.y, look.z, e];
  });
  const mode = useGame((s) => s.mode);
  return <Character pose={pose} suit="#d9541a" hat="#ffffff" visible={mode !== "seated"} />;
}
