import { create } from "zustand";
import type { InteractId } from "./world";

export type Mode = "explore" | "seated";
export type Quality = "low" | "high";
interface GameUI {
  mode: Mode; paused: boolean; account: boolean; prompt: { id: InteractId; label: string } | null; info: string | null; quality: Quality; user: { id: string; email: string } | null;
  set: (p: Partial<Omit<GameUI, "set">>) => void;
}
export const useGame = create<GameUI>((set) => ({
  mode: "explore", paused: false, account: false, prompt: null, info: null, quality: "high", user: null,
  set: (p) => set(p),
}));

/** Per-frame input, written by keyboard/touch handlers and read in the frame loop. */
export const input = {
  keys: new Set<string>(), joyX: 0, joyY: 0, sprint: false, yaw: 0, pitch: 0.28, dist: 6,
  leverKey: 0, interact: false,
};
/** Player state shared with HUD/minimap. */
export const player = { x: 11, y: 0, z: 20, heading: Math.PI, speed: 0 };
