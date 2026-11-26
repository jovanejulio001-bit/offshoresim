import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { Lighting, Ocean } from "./Environment";
import { Platform } from "./Platform";
import { Doghouse, MudSystem, TopDriveSystem } from "./Rig";
import { Workers } from "./Workers";
import { PlayerRig } from "./PlayerRig";
import { Hud } from "./hud/Hud";
import { TouchControls } from "./hud/TouchControls";
import { DrillerConsole } from "./hud/DrillerConsole";
import { PauseMenu } from "./hud/PauseMenu";
import { AccountDialog } from "./hud/AccountDialog";
import { input, useGame } from "@/game/store";
import { interact, standUp } from "@/game/actions";
import { S } from "@/game/sim";
import { player } from "@/game/store";
import { useAccount } from "@/game/useAccount";

export default function GameCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const quality = useGame((s) => s.quality);
  useAccount();

  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>)["__game"] = { S, player, input, ui: useGame, interact };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const ui = useGame.getState();
      if (e.code === "Escape") {
        if (ui.account) return ui.set({ account: false });
        if (ui.mode === "seated") return standUp();
        return ui.set({ paused: !ui.paused });
      }
      if (ui.paused || ui.account) return;
      if (ui.mode === "seated") {
        if (e.code === "KeyW" || e.code === "ArrowUp") input.leverKey = 1;
        if (e.code === "KeyS" || e.code === "ArrowDown") input.leverKey = -1;
        if (e.code === "KeyE") standUp();
        return;
      }
      input.keys.add(e.code);
      if (e.code === "KeyE" && !e.repeat && ui.prompt) interact(ui.prompt.id);
    };
    const up = (e: KeyboardEvent) => {
      input.keys.delete(e.code);
      if (["KeyW", "KeyS", "ArrowUp", "ArrowDown"].includes(e.code) && input.leverKey !== 0) { input.leverKey = 0; S.lever = 0; }
    };
    const blur = () => { input.keys.clear(); input.leverKey = 0; S.lever = 0; };
    const lockChange = () => { if (!document.pointerLockElement && useGame.getState().mode === "explore" && !useGame.getState().account && lockedOnce.current) useGame.getState().set({ paused: true }); };
    const lockedOnce = { current: false };
    const mm = (e: MouseEvent) => {
      if (document.pointerLockElement) { lockedOnce.current = true; input.yaw -= e.movementX * 0.0028; input.pitch = Math.max(-0.35, Math.min(1.2, input.pitch + e.movementY * 0.0022)); }
    };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    document.addEventListener("pointerlockchange", lockChange); window.addEventListener("mousemove", mm);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); document.removeEventListener("pointerlockchange", lockChange); window.removeEventListener("mousemove", mm); };
  }, []);

  const drag = useRef<{ x: number; y: number } | null>(null);
  return (
    <div ref={wrap} className="fixed inset-0 select-none overflow-hidden bg-background touch-none">
      <Canvas
        shadows={quality === "high" ? { type: THREE.PCFSoftShadowMap } : false}
        dpr={quality === "high" ? [1, 1.75] : [0.75, 1]}
        camera={{ fov: 62, near: 0.1, far: 2500, position: [12, 3, 26] }}
        gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; wrap.current?.setAttribute("data-scene-ready", "1"); }}
        onPointerDown={(e) => {
          const ui = useGame.getState();
          if (e.pointerType === "mouse" && ui.mode === "explore" && !ui.paused) { (e.target as HTMLCanvasElement).requestPointerLock?.(); }
          if (e.pointerType === "mouse" && ui.mode === "seated") drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => { if (drag.current && !document.pointerLockElement && e.buttons === 2) { input.yaw -= (e.clientX - drag.current.x) * 0.004; drag.current = { x: e.clientX, y: e.clientY }; } }}
        onPointerUp={() => { drag.current = null; }}
        onWheel={(e) => { input.dist = Math.max(2.2, Math.min(12, input.dist + e.deltaY * 0.006)); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Lighting />
        <Ocean />
        <Suspense fallback={null}>
          <Platform />
          <TopDriveSystem />
          <Doghouse />
        </Suspense>
        <MudSystem />
        <Workers />
        <PlayerRig />
      </Canvas>
      <Hud />
      <TouchControls />
      <DrillerConsole />
      <PauseMenu />
      <AccountDialog />
    </div>
  );
}
