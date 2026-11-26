import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { Beams, railSegs, type Seg } from "./Beams";
import { tex } from "./textures";
import { DECK, FLOOR_Y as F, RIG, STAIRS } from "@/game/world";

function useMats() {
  return useMemo(() => {
    const steel = tex.steel();
    const plate = tex.plate().clone(); plate.repeat.set(14, 12); plate.needsUpdate = true;
    const grate = tex.grating().clone(); grate.repeat.set(11, 7); grate.needsUpdate = true;
    return {
      deck: new THREE.MeshStandardMaterial({ map: plate, color: "#9aa0a3", roughness: 0.75, metalness: 0.55 }),
      grate: new THREE.MeshStandardMaterial({ map: grate, roughness: 0.6, metalness: 0.7 }),
      yellow: new THREE.MeshStandardMaterial({ color: "#e5a812", roughness: 0.5, metalness: 0.35, map: steel }),
      red: new THREE.MeshStandardMaterial({ color: "#b8402a", roughness: 0.55, metalness: 0.45, map: steel }),
      white: new THREE.MeshStandardMaterial({ color: "#e6e4dc", roughness: 0.6, metalness: 0.2, map: steel }),
      grey: new THREE.MeshStandardMaterial({ color: "#7b8288", roughness: 0.55, metalness: 0.6, map: steel }),
      dark: new THREE.MeshStandardMaterial({ color: "#33383c", roughness: 0.6, metalness: 0.6 }),
      hazard: new THREE.MeshStandardMaterial({ map: tex.hazard(), roughness: 0.6 }),
      blue: new THREE.MeshStandardMaterial({ color: "#2e5d8a", roughness: 0.55, metalness: 0.3, map: steel }),
      green: new THREE.MeshStandardMaterial({ color: "#3d6b4a", roughness: 0.6, metalness: 0.3, map: steel }),
    };
  }, []);
}
export type Mats = ReturnType<typeof useMats>;

const B = ({ m, p, s, r }: { m: THREE.Material; p: [number, number, number]; s: [number, number, number]; r?: [number, number, number] }) => (
  <mesh material={m} position={p} rotation={r ?? [0, 0, 0]} castShadow receiveShadow><boxGeometry args={s} /></mesh>
);
const Cyl = ({ m, p, r, h, rot, seg = 16 }: { m: THREE.Material; p: [number, number, number]; r: number; h: number; rot?: [number, number, number]; seg?: number }) => (
  <mesh material={m} position={p} rotation={rot ?? [0, 0, 0]} castShadow receiveShadow><cylinderGeometry args={[r, r, h, seg]} /></mesh>
);

export function Sign({ text, p, r = 0, size = 0.45 }: { text: string; p: [number, number, number]; r?: number; size?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <mesh position={[0, 0, -0.02]}><planeGeometry args={[text.length * size * 0.62 + 0.4, size * 1.7]} /><meshStandardMaterial color="#12324a" roughness={0.6} /></mesh>
      <Text fontSize={size} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0}>{text}</Text>
    </group>
  );
}

export function Platform() {
  const M = useMats();
  const W = DECK.x1 - DECK.x0, D = DECK.z1 - DECK.z0, cx = (DECK.x0 + DECK.x1) / 2, cz = (DECK.z0 + DECK.z1) / 2;

  // jacket legs + cross bracing under the deck, down into the sea
  const jacket = useMemo<Seg[]>(() => {
    const s: Seg[] = []; const legs: [number, number][] = [[DECK.x0 + 3, DECK.z0 + 3], [DECK.x1 - 3, DECK.z0 + 3], [DECK.x0 + 3, DECK.z1 - 3], [DECK.x1 - 3, DECK.z1 - 3]];
    for (let i = 0; i < 4; i++) for (const [a, b] of [[0, 1], [2, 3], [0, 2], [1, 3]] as const) {
      const y0 = -2 - i * 6, y1 = y0 - 6, A = legs[a]!, Bp = legs[b]!;
      s.push([A[0], y0, A[1], Bp[0], y1, Bp[1], 0.5], [Bp[0], y0, Bp[1], A[0], y1, A[1], 0.5], [A[0], y0, A[1], Bp[0], y0, Bp[1], 0.45]);
    }
    return s;
  }, []);

  // rig-floor substructure truss (box frame below the drill floor)
  const sub = useMemo<Seg[]>(() => {
    const s: Seg[] = [];
    for (let x = RIG.x0; x <= RIG.x1 + 0.01; x += 22 / 6) for (const z of [RIG.z0, RIG.z1]) s.push([x, 0, z, x, F, z, 0.32]);
    for (let z = RIG.z0; z <= RIG.z1 + 0.01; z += 14 / 4) for (const x of [RIG.x0, RIG.x1]) s.push([x, 0, z, x, F, z, 0.32]);
    for (let x = RIG.x0; x < RIG.x1 - 0.1; x += 22 / 6) for (const z of [RIG.z0, RIG.z1]) s.push([x, 0.2, z, x + 22 / 6, F - 0.3, z, 0.18]);
    for (let z = RIG.z0; z < RIG.z1 - 0.1; z += 14 / 4) for (const x of [RIG.x0, RIG.x1]) s.push([x, F - 0.3, z, x, 0.2, z + 14 / 4, 0.18]);
    return s;
  }, []);

  // derrick lattice: 4 tapered legs, girts and X bracing
  const derrick = useMemo<Seg[]>(() => {
    const s: Seg[] = []; const H = 38, b0 = 4, b1 = 1.4, y0 = F + 0.3, lv = 10;
    const corner = (i: number, t: number): [number, number, number] => { const b = b0 + (b1 - b0) * t; const sx = i === 0 || i === 3 ? -1 : 1, sz = i < 2 ? -1 : 1; return [sx * b, y0 + H * t, sz * b]; };
    for (let i = 0; i < 4; i++) { const a = corner(i, 0), c = corner(i, 1); s.push([...a, ...c, 0.42]); }
    const ring = [0, 1, 2, 3, 0];
    for (let k = 0; k < lv; k++) {
      const t0 = k / lv, t1 = (k + 1) / lv;
      for (let e = 0; e < 4; e++) {
        const i = ring[e]!, j = ring[e + 1]!;
        if (k > 0 || e !== 3) { // open V-door at the front (z+) on the bottom bay
          s.push([...corner(i, t1), ...corner(j, t1), 0.2]);
          s.push([...corner(i, t0), ...corner(j, t1), 0.13], [...corner(j, t0), ...corner(i, t1), 0.13]);
        }
      }
    }
    // monkey board at ~24 m above the floor (back side)
    return s;
  }, []);

  const rails = useMemo<Seg[]>(() => [
    ...railSegs([[DECK.x0 + 0.3, DECK.z0 + 0.3], [DECK.x1 - 0.3, DECK.z0 + 0.3], [DECK.x1 - 0.3, DECK.z1 - 0.3], [DECK.x0 + 0.3, DECK.z1 - 0.3], [DECK.x0 + 0.3, DECK.z0 + 0.3]], 0),
    ...railSegs([[STAIRS.x0, RIG.z1], [RIG.x0, RIG.z1], [RIG.x0, RIG.z0], [RIG.x1, RIG.z0], [RIG.x1, RIG.z1], [STAIRS.x1, RIG.z1]], F),
    ...railSegs([[STAIRS.x0, RIG.z1], [STAIRS.x0, STAIRS.zBot]], 0, 1).map((s) => { const t = (z: number) => F * (1 - (z - STAIRS.zTop) / (STAIRS.zBot - STAIRS.zTop)); return [s[0], s[1] + t(s[2]), s[2], s[3], s[4] + t(s[5]), s[5], s[6]] as Seg; }),
    ...railSegs([[STAIRS.x1, RIG.z1], [STAIRS.x1, STAIRS.zBot]], 0, 1).map((s) => { const t = (z: number) => F * (1 - (z - STAIRS.zTop) / (STAIRS.zBot - STAIRS.zTop)); return [s[0], s[1] + t(s[2]), s[2], s[3], s[4] + t(s[5]), s[5], s[6]] as Seg; }),
    ...railSegs([[-1.6, -4.3], [1.6, -4.3]], F + 24, 1), // monkey board rail
  ], []);

  const steps = useMemo(() => { const out: [number, number][] = []; const n = 14; for (let i = 0; i < n; i++) { const z = STAIRS.zTop + (i + 0.5) * ((STAIRS.zBot - STAIRS.zTop) / n); out.push([z, F * (1 - (z - STAIRS.zTop) / (STAIRS.zBot - STAIRS.zTop))]); } return out; }, []);

  return (
    <group>
      {/* main deck */}
      <mesh material={M.deck} position={[cx, -0.25, cz]} receiveShadow><boxGeometry args={[W, 0.5, D]} /></mesh>
      <mesh material={M.yellow} position={[cx, -1.2, cz]}><boxGeometry args={[W + 0.6, 1.4, D + 0.6]} /></mesh>
      {/* walkway markings */}
      {[[-4, 11, 2, 22], [0, 10.5, 50, 1.6]].map((r, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[r[0]!, 0.012, r[1]!]}><planeGeometry args={[r[2]!, r[3]!]} /><meshStandardMaterial color="#3f7d4c" roughness={0.8} transparent opacity={0.8} /></mesh>)}
      <Beams segs={jacket} color="#d29a1c" size={0.5} />
      {[[DECK.x0 + 3, DECK.z0 + 3], [DECK.x1 - 3, DECK.z0 + 3], [DECK.x0 + 3, DECK.z1 - 3], [DECK.x1 - 3, DECK.z1 - 3]].map(([x, z], i) => <Cyl key={i} m={M.yellow} p={[x!, -14, z!]} r={1.3} h={26} />)}

      {/* drill floor */}
      <mesh material={M.grate} position={[(RIG.x0 + RIG.x1) / 2, F - 0.15, 0]} receiveShadow castShadow><boxGeometry args={[RIG.x1 - RIG.x0, 0.3, RIG.z1 - RIG.z0]} /></mesh>
      <Beams segs={sub} color="#c63f22" size={0.3} map={tex.steel()} />
      {/* stairs */}
      {steps.map(([z, y], i) => <B key={i} m={M.grate} p={[(STAIRS.x0 + STAIRS.x1) / 2, y - 0.08, z]} s={[STAIRS.x1 - STAIRS.x0, 0.12, 0.5]} />)}
      {[STAIRS.x0, STAIRS.x1].map((x) => <B key={x} m={M.yellow} p={[x, F / 2 - 0.3, (STAIRS.zTop + STAIRS.zBot) / 2]} s={[0.12, 0.35, Math.hypot(8, F)]} r={[Math.atan2(F, 8), 0, 0]} />)}
      <Beams segs={rails} color="#e7b416" size={0.06} metalness={0.3} roughness={0.5} />

      {/* derrick */}
      <Beams segs={derrick} color="#c8452a" size={0.2} map={tex.steel()} />
      <B m={M.grey} p={[0, F + 38.6, 0]} s={[3.6, 1.2, 3.6]} />
      {[-0.8, 0, 0.8].map((x) => <Cyl key={x} m={M.yellow} p={[x, F + 38.2, 0]} r={0.6} h={0.25} rot={[0, 0, Math.PI / 2]} />)}
      <B m={M.grate} p={[0, F + 24, -3.4]} s={[3.4, 0.15, 1.8]} />
      {/* fingerboard with racked stands */}
      {Array.from({ length: 8 }, (_, i) => <Cyl key={i} m={M.grey} p={[-1.3 + i * 0.37, F + 13.2, -3.1]} r={0.07} h={21} seg={8} />)}
      {/* guide rails for the top drive */}
      {[-0.9, 0.9].map((x) => <B key={x} m={M.dark} p={[x, F + 18, -1.3]} s={[0.18, 34, 0.18]} />)}
      {/* rotary table + rig floor kit */}
      <Cyl m={M.dark} p={[0, F + 0.25, 0]} r={1.25} h={0.5} seg={24} />
      <Cyl m={M.yellow} p={[0, F + 0.52, 0]} r={0.75} h={0.06} seg={24} />
      <B m={M.hazard} p={[0, F + 0.01, 0]} s={[3.6, 0.02, 3.6]} />
      {/* iron roughneck + mousehole + catwalk to V-door */}
      <B m={M.yellow} p={[2.6, F + 0.9, 1.6]} s={[0.8, 1.8, 1.1]} />
      <B m={M.dark} p={[2.6, F + 1.6, 0.9]} s={[0.5, 0.4, 0.6]} />
      <Cyl m={M.dark} p={[1.6, F + 0.4, 2.2]} r={0.2} h={0.8} />
      <mesh material={M.yellow} position={[0, F / 2, 10]} rotation={[-Math.atan2(F - 1.2, 6), 0, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.25, 7.2]} /></mesh>

      {/* drawworks */}
      <B m={M.blue} p={[-5.6, F + 1.1, 0]} s={[2.2, 2.2, 3.6]} />
      {/* pipe rack with drill pipe */}
      <B m={M.yellow} p={[4, 0.3, 20]} s={[10, 0.6, 6]} />
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: 10 - r }, (_, i) => <Cyl key={`${r}-${i}`} m={M.grey} p={[4, 0.85 + r * 0.24, 17.6 + i * 0.26 + r * 0.13]} r={0.12} h={9.6} rot={[0, 0, Math.PI / 2]} seg={10} />))}
      {/* containers */}
      {[["#2f6db0", 0], ["#c0392b", 1], ["#2e8b57", 2]].map(([c, i]) => (
        <mesh key={i as number} position={[20.25, 1.35, -18.8 + (i as number) * 3.2]} castShadow receiveShadow>
          <boxGeometry args={[6.5, 2.7, 2.4]} /><meshStandardMaterial color={c as string} map={tex.container()} roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {/* living quarters */}
      <B m={M.white} p={[0, 6, -21.5]} s={[54, 12, 5]} />
      {Array.from({ length: 3 }, (_, f) => Array.from({ length: 16 }, (_, i) => <mesh key={`${f}-${i}`} position={[-24 + i * 3.2, 2.5 + f * 3.4, -18.98]}><planeGeometry args={[1.4, 1]} /><meshStandardMaterial color="#1a2a35" metalness={0.9} roughness={0.15} emissive="#ffcf8a" emissiveIntensity={(i + f) % 3 ? 0 : 0.35} /></mesh>))}
      <Sign text="ALOJAMENTO" p={[0, 11, -18.95]} size={0.8} />
      {/* helideck */}
      <Cyl m={M.green} p={[-14, 13, -23]} r={9} h={0.4} seg={32} />
      <Text position={[-14, 13.22, -23]} rotation={[-Math.PI / 2, 0, 0]} fontSize={5} color="#f3f3f3">H</Text>
      {/* crane */}
      <Cyl m={M.yellow} p={[21, 10, 10]} r={1.6} h={20} />
      <group position={[21, 20.5, 10]} rotation={[0, -2.2, 0]}>
        <B m={M.yellow} p={[0, 1, 0]} s={[3, 2.2, 3]} />
        <mesh material={M.yellow} position={[0, 7, 9]} rotation={[-1.1, 0, 0]} castShadow><boxGeometry args={[0.8, 0.8, 21]} /></mesh>
      </group>
      {/* BOP accumulator unit */}
      <B m={M.red} p={[15.5, 1.5, 16]} s={[3, 3, 4]} />
      <Sign text="CONTROLO BOP" p={[15.5, 3.4, 13.9]} r={0} size={0.3} />
      {/* signage */}
      <Sign text="PISO DE PERFURAÇÃO" p={[0, F + 3.6, 4.05]} size={0.35} />
      <Sign text="TANQUES DE LAMA" p={[-18, 4.1, 2.1]} size={0.4} />
      <Sign text="BOMBAS DE LAMA" p={[-18.5, 3.4, 18.6]} size={0.4} />
      <Sign text="RACK DE TUBOS" p={[4, 2.3, 23.2]} r={Math.PI} size={0.35} />
      {/* scattered safety kit */}
      {[[-3, 14], [8, -12], [-24, 22], [24, 22]].map(([x, z], i) => <group key={i} position={[x!, 0, z!]}><B m={M.red} p={[0, 0.6, 0]} s={[0.6, 1.2, 0.4]} /><Cyl m={M.white} p={[0, 1.35, 0]} r={0.35} h={0.1} rot={[Math.PI / 2, 0, 0]} /></group>)}
      {Array.from({ length: 6 }, (_, i) => <Cyl key={i} m={i % 2 ? M.blue : M.grey} p={[-26 + (i % 3) * 0.7, 0.45, 23 + Math.floor(i / 3) * 0.7]} r={0.3} h={0.9} />)}
    </group>
  );
}
