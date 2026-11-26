// World layout and movement rules (pure TS). Units: metres. Main deck y=0, drill floor y=FLOOR_Y.
export const FLOOR_Y = 4;
export const DECK = { x0: -28, x1: 28, z0: -24, z1: 26 };
/** Elevated drill floor (rig floor + doghouse level). */
export const RIG = { x0: -7, x1: 15, z0: -7, z1: 7 };
/** Stairs from main deck (z=15) up to the rig floor edge (z=7). */
export const STAIRS = { x0: 10, x1: 12.4, zTop: 7, zBot: 15 };
export const DOGHOUSE = { x0: 8, x1: 15, z0: -5, z1: 3, h: 3.2 };
export const DOOR = { x: 8, z0: 0.6, z1: 2.2 }; // door in the west wall (faces the derrick)
export const CHAIR = { x: 11.2, z: -1.4 };

export function groundAt(x: number, z: number): number {
  if (x >= STAIRS.x0 && x <= STAIRS.x1 && z >= STAIRS.zTop && z <= STAIRS.zBot)
    return FLOOR_Y * (1 - (z - STAIRS.zTop) / (STAIRS.zBot - STAIRS.zTop));
  if (x >= RIG.x0 && x <= RIG.x1 && z >= RIG.z0 && z <= RIG.z1) return FLOOR_Y;
  return 0;
}

export interface Collider { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number; when?: () => boolean }
export const colliders: Collider[] = [];
const box = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, when?: () => boolean) =>
  colliders.push(when ? { x0, x1, z0, z1, y0, y1, when } : { x0, x1, z0, z1, y0, y1 });

export const doorState = { open: 0, target: 0 };

// derrick legs + rotary table
for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]] as const) box(x - 0.45, x + 0.45, z - 0.45, z + 0.45, 0, 60);
box(-1.3, 1.3, -1.3, 1.3, FLOOR_Y, FLOOR_Y + 1);
// doghouse walls (thickness 0.25)
const D = DOGHOUSE, Y0 = FLOOR_Y, Y1 = FLOOR_Y + D.h;
box(D.x0, D.x1, D.z0 - 0.15, D.z0 + 0.15, Y0, Y1);
box(D.x0, D.x1, D.z1 - 0.15, D.z1 + 0.15, Y0, Y1);
box(D.x1 - 0.15, D.x1 + 0.15, D.z0, D.z1, Y0, Y1);
box(D.x0 - 0.15, D.x0 + 0.15, D.z0, DOOR.z0, Y0, Y1);
box(D.x0 - 0.15, D.x0 + 0.15, DOOR.z1, D.z1, Y0, Y1);
box(D.x0 - 0.15, D.x0 + 0.15, DOOR.z0, DOOR.z1, Y0, Y1, () => doorState.open < 0.75);
// driller console + chair inside the doghouse
box(8.3, 9.9, -4.6, 1.2 - 1.2, Y0, Y0 + 1.2);
box(CHAIR.x - 0.4, CHAIR.x + 0.4, CHAIR.z - 0.4, CHAIR.z + 0.4, Y0, Y0 + 1.3);
// mud tanks, pumps, shakers, containers, pipe rack, quarters, crane pedestal
box(-24, -12, -12, 2, 0, 3.4);
box(-24, -13, 8, 18, 0, 2.6);
box(-10.5, -7.5, -6, -1.5, 0, 2.2);
for (let i = 0; i < 3; i++) box(17, 23.5, -20 + i * 3.2, -17.6 + i * 3.2, 0, 2.7);
box(-1, 9, 17, 23, 0, 1.6);
box(-27, 27, -24, -19, 0, 12);
box(19, 23, 8, 12, 0, 20);
box(14, 17, 14, 18, 0, 3); // BOP control unit (accumulator)

export const PLAYER_R = 0.35;
export function blocked(x: number, z: number, y: number): boolean {
  if (x < DECK.x0 + 0.8 || x > DECK.x1 - 0.8 || z < DECK.z0 + 0.8 || z > DECK.z1 - 0.8) return true;
  for (const c of colliders) {
    if (c.when && !c.when()) continue;
    if (y + 1.7 < c.y0 || y + 0.3 > c.y1) continue;
    if (x + PLAYER_R > c.x0 && x - PLAYER_R < c.x1 && z + PLAYER_R > c.z0 && z - PLAYER_R < c.z1) return true;
  }
  return false;
}

/** Try to move; a step up or down larger than MAX_STEP is treated as a wall or railing. */
export const MAX_STEP = 0.6;
export function tryMove(p: { x: number; y: number; z: number }, dx: number, dz: number) {
  const attempt = (nx: number, nz: number) => {
    const g = groundAt(nx, nz);
    if (Math.abs(g - p.y) > MAX_STEP) return false;
    if (blocked(nx, nz, g)) return false;
    p.x = nx; p.z = nz; p.y = g; return true;
  };
  if (!attempt(p.x + dx, p.z + dz)) { attempt(p.x + dx, p.z) || attempt(p.x, p.z + dz); }
}

export function insideDoghouse(x: number, z: number, y: number) {
  return y > FLOOR_Y - 0.5 && x > DOGHOUSE.x0 && x < DOGHOUSE.x1 && z > DOGHOUSE.z0 && z < DOGHOUSE.z1;
}

export type InteractId = "door" | "chair" | "pump" | "hopper" | "shaker" | "bop" | "rack" | "rotary";
export interface Interactable { id: InteractId; x: number; y: number; z: number; r: number; label: () => string }
export const interactables: Interactable[] = [
  { id: "door", x: DOOR.x, y: FLOOR_Y, z: (DOOR.z0 + DOOR.z1) / 2, r: 2, label: () => (doorState.target ? "Fechar porta" : "Abrir porta da Doghouse") },
  { id: "chair", x: CHAIR.x, y: FLOOR_Y, z: CHAIR.z, r: 1.6, label: () => "Sentar na cadeira do Driller" },
  { id: "pump", x: -18, y: 0, z: 19.3, r: 3, label: () => "Painel local das bombas" },
  { id: "hopper", x: -11, y: 0, z: -5, r: 2.6, label: () => "Adicionar barite (funil de mistura)" },
  { id: "shaker", x: -9, y: 0, z: -0.6, r: 2.6, label: () => "Inspecionar peneiras" },
  { id: "bop", x: 15.5, y: 0, z: 13, r: 2.6, label: () => "Unidade de controlo do BOP" },
  { id: "rack", x: 4, y: 0, z: 16, r: 3, label: () => "Inspecionar rack de tubos" },
  { id: "rotary", x: 0, y: FLOOR_Y, z: 2.2, r: 2.2, label: () => "Inspecionar mesa rotativa" },
];

export function nearestInteractable(x: number, y: number, z: number): Interactable | null {
  let best: Interactable | null = null, bd = 1e9;
  for (const it of interactables) {
    if (Math.abs(it.y - y) > 1.5) continue;
    const d = Math.hypot(it.x - x, it.z - z);
    if (d < it.r && d < bd) { bd = d; best = it; }
  }
  return best;
}
