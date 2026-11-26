import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { S, clamp } from "@/game/sim";
import { DOGHOUSE as DH, DOOR, CHAIR, FLOOR_Y as F, doorState } from "@/game/world";
import { drawMonitor } from "@/game/draw";
import { input, useGame } from "@/game/store";
import { tex } from "./textures";
import { Sign } from "./Platform";

const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.5, ...o });

/** Top drive, travelling block, drill line, drill string, drawworks drum — all driven by S. */
export function TopDriveSystem() {
  const td = useRef<THREE.Group>(null), shaft = useRef<THREE.Group>(null), pipe = useRef<THREE.Mesh>(null), stub = useRef<THREE.Mesh>(null);
  const block = useRef<THREE.Group>(null), lines = useRef<THREE.Group>(null), drum = useRef<THREE.Mesh>(null), elev = useRef<THREE.Group>(null), newJoint = useRef<THREE.Mesh>(null), slips = useRef<THREE.Group>(null);
  const M = useMemo(() => {
    const pt = tex.flow().clone(); pt.repeat.set(1, 6); pt.needsUpdate = true;
    return { yellow: std("#e5a812", { map: tex.steel() }), dark: std("#2b2f33"), pipe: std("#8f969c", { metalness: 0.85, roughness: 0.35 }), band: std("#d6dadd", { metalness: 0.9, roughness: 0.2 }), red: std("#c0392b"), line: std("#1a1a1a", { roughness: 0.4 }) };
  }, []);
  useFrame(() => {
    const y = F + 2.2 + S.h; // bottom of the top drive
    if (td.current) td.current.position.y = y;
    if (shaft.current) shaft.current.rotation.y = -S.rotAngle;
    if (block.current) block.current.position.y = y + 3.6;
    if (lines.current) { const top = F + 38, len = top - (y + 4.4); lines.current.position.y = y + 4.4 + len / 2; lines.current.scale.y = Math.max(0.1, len); }
    if (drum.current) drum.current.rotation.x += S.vel * 0.05;
    if (elev.current) { const o = S.elevClosed ? 0 : 0.5; elev.current.children.forEach((c, i) => (c.rotation.z = (i ? -1 : 1) * o)); }
    const top = F + 0.5;
    const showFull = !(S.slips && S.needConn);
    if (pipe.current) { const len = Math.max(0.05, y - 0.4 - top); pipe.current.visible = showFull || S.conn > 0; pipe.current.position.y = top + len / 2; pipe.current.scale.y = len; pipe.current.rotation.y = -S.rotAngle; }
    if (stub.current) stub.current.visible = !showFull && S.conn <= 0;
    if (newJoint.current) newJoint.current.visible = S.slips === 1 && S.needConn === 1 && S.conn <= 0;
    if (slips.current) slips.current.visible = S.slips === 1;
  });
  return (
    <group>
      <group ref={td}>
        <mesh material={M.yellow} position={[0, 1.6, -0.25]} castShadow><boxGeometry args={[1.5, 2.2, 1.3]} /></mesh>
        <mesh material={M.dark} position={[0, 2.9, -0.25]} castShadow><boxGeometry args={[1.1, 0.6, 1.1]} /></mesh>
        <mesh material={M.yellow} position={[0, 1.6, -1.15]} castShadow><boxGeometry args={[2.1, 0.5, 0.4]} /></mesh>
        <Sign text="TOP DRIVE" p={[0, 1.8, 0.42]} size={0.18} />
        {/* gooseneck / mud hose */}
        <mesh material={M.dark} position={[0.55, 2.9, -0.25]} rotation={[0, 0, -0.5]}><torusGeometry args={[0.45, 0.08, 8, 16, Math.PI]} /></mesh>
        <group ref={shaft}>
          <mesh material={M.band} position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.6, 14]} /></mesh>
          <mesh material={M.red} position={[0.19, 0.25, 0]}><boxGeometry args={[0.04, 0.5, 0.05]} /></mesh>
        </group>
        {/* elevator links */}
        <group ref={elev} position={[0, 0.2, 0]}>
          <mesh material={M.dark} position={[-0.38, -0.3, 0]}><boxGeometry args={[0.07, 0.9, 0.07]} /></mesh>
          <mesh material={M.dark} position={[0.38, -0.3, 0]}><boxGeometry args={[0.07, 0.9, 0.07]} /></mesh>
        </group>
      </group>
      <group ref={block}>
        <mesh material={M.yellow} castShadow><boxGeometry args={[1.2, 1.4, 0.7]} /></mesh>
        {[-0.3, 0, 0.3].map((x) => <mesh key={x} material={M.dark} position={[x, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.75, 16]} /></mesh>)}
      </group>
      <group ref={lines}>
        {[-0.45, -0.15, 0.15, 0.45].map((x) => <mesh key={x} material={M.line} position={[x, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 1, 5]} /></mesh>)}
      </group>
      {/* drill line to drawworks */}
      <mesh material={M.line} position={[-2.8, F + 20, 0]} rotation={[0, 0, Math.atan2(5.6, 36)]}><cylinderGeometry args={[0.03, 0.03, 36.5, 5]} /></mesh>
      <mesh ref={drum} material={M.dark} position={[-5.6, F + 2.4, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.6, 0.6, 2.4, 20]} /></mesh>
      <mesh ref={pipe} material={M.pipe} castShadow><cylinderGeometry args={[0.1, 0.1, 1, 12]} /></mesh>
      <mesh ref={stub} material={M.band} position={[0, F + 1.0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.9, 12]} /></mesh>
      <mesh ref={newJoint} material={M.pipe} position={[0, F + 5.5, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 9.5, 12]} /></mesh>
      <group ref={slips} position={[0, F + 0.65, 0]}>
        {[0, 1, 2].map((i) => <mesh key={i} material={M.red} position={[Math.cos(i * 2.1) * 0.2, 0, Math.sin(i * 2.1) * 0.2]}><boxGeometry args={[0.15, 0.3, 0.15]} /></mesh>)}
      </group>
    </group>
  );
}

/** Mud pumps, tanks, shakers, flow lines; pistons, agitators and flow textures follow the sim. */
export function MudSystem() {
  const pistons = useRef<THREE.Mesh[]>([]), cranks = useRef<THREE.Mesh[]>([]), agit = useRef<THREE.Mesh[]>([]), levels = useRef<THREE.Mesh[]>([]);
  const shaker = useRef<THREE.Group>(null);
  const supply = useMemo(() => { const t = tex.flow().clone(); t.repeat.set(1, 30); t.needsUpdate = true; return t; }, []);
  const ret = useMemo(() => { const t = tex.flow().clone(); t.repeat.set(1, 10); t.needsUpdate = true; return t; }, []);
  const M = useMemo(() => ({ blue: std("#2e5d8a", { map: tex.steel() }), grey: std("#80878d", { map: tex.steel() }), dark: std("#2b2f33"), mud: std("#5a4027", { roughness: 0.25, metalness: 0.1 }), chrome: std("#dfe3e6", { metalness: 0.95, roughness: 0.15 }), green: std("#3d6b4a", { map: tex.steel() }), supply: std("#ffffff", { map: supply, metalness: 0.3, roughness: 0.4, emissive: "#3a2410", emissiveIntensity: 0.4 }), ret: std("#ffffff", { map: ret, metalness: 0.3, roughness: 0.4 }) }), [supply, ret]);
  useFrame((_, d) => {
    const ph = S.pumpPhase;
    pistons.current.forEach((p, i) => { if (p) p.position.x = -0.9 + Math.sin(ph + (i % 3) * 2.094) * 0.35; });
    cranks.current.forEach((c) => { if (c) c.rotation.x = ph; });
    agit.current.forEach((a, i) => { if (a) a.rotation.y += Math.min(d, 0.05) * (3 + i * 0.3); });
    const lvl = clamp((S.pit - 200) / 600, 0.1, 1);
    levels.current.forEach((l) => { if (l) l.position.y = 0.3 + lvl * 2.8; });
    supply.offset.y -= Math.min(d, 0.05) * S.fin * 0.004;
    ret.offset.y -= Math.min(d, 0.05) * S.fout * 0.004;
    if (shaker.current) shaker.current.position.y = S.fout > 5 ? Math.sin(S.t * 60) * 0.02 : 0;
  });
  return (
    <group>
      {/* 3 mud tanks with open grating tops */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-18, 0, -9.5 + i * 4.6]}>
          <mesh material={M.green} position={[0, 1.7, 0]} castShadow receiveShadow><boxGeometry args={[12, 3.4, 4.2]} /></mesh>
          <mesh ref={(m) => { if (m) levels.current[i] = m; }} material={M.mud} position={[0, 2, 0]}><boxGeometry args={[11.6, 0.05, 3.8]} /></mesh>
          {[-3.5, 0, 3.5].map((x, k) => (
            <group key={x} position={[x, 3.4, 0]}>
              <mesh material={M.blue} position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.35, 0.35, 0.9, 12]} /></mesh>
              <mesh ref={(m) => { if (m) agit.current[i * 3 + k] = m; }} material={M.chrome} position={[0, 1.05, 0]}><boxGeometry args={[0.9, 0.08, 0.12]} /></mesh>
            </group>
          ))}
        </group>
      ))}
      {/* mixing hopper */}
      <group position={[-11.2, 0, -5]}>
        <mesh material={M.grey} position={[0, 1.4, 0]} rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.8, 1.2, 4]} /></mesh>
        <mesh material={M.dark} position={[0, 0.5, 0]}><cylinderGeometry args={[0.12, 0.12, 1, 8]} /></mesh>
        {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[1.2, 0.2 + Math.floor(i / 2) * 0.32, -0.4 + (i % 2) * 0.6]} castShadow><boxGeometry args={[0.55, 0.3, 0.45]} /><meshStandardMaterial color="#d8c9a8" roughness={0.95} /></mesh>)}
      </group>
      {/* shale shakers fed by the flow line */}
      <group ref={shaker}>
        <mesh material={M.blue} position={[-9, 1.1, -3.8]} castShadow><boxGeometry args={[2.8, 2.2, 4.3]} /></mesh>
        <mesh material={M.chrome} position={[-9, 2.25, -3.8]} rotation={[0.12, 0, 0]}><boxGeometry args={[2.4, 0.06, 3.9]} /></mesh>
      </group>
      <mesh material={M.ret} position={[-4.5, 3, -3.5]} rotation={[0, 0, Math.PI / 2 + 0.25]}><cylinderGeometry args={[0.18, 0.18, 7.5, 10]} /></mesh>
      {/* triplex mud pumps */}
      {[0, 1, 2].map((p) => (
        <group key={p} position={[-21.5 + p * 3.6, 0, 13]}>
          <mesh material={M.blue} position={[0, 1.2, 0]} castShadow><boxGeometry args={[2.6, 2.4, 4.2]} /></mesh>
          <mesh material={M.grey} position={[0, 1.2, 3]} castShadow><boxGeometry args={[2.2, 1.6, 1.8]} /></mesh>
          <mesh ref={(m) => { if (m) cranks.current[p] = m; }} material={M.dark} position={[1.4, 1.6, -0.8]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[1, 1, 0.2, 6]} /></mesh>
          {[0, 1, 2].map((k) => <mesh key={k} ref={(m) => { if (m) pistons.current[p * 3 + k] = m; }} material={M.chrome} position={[-0.9, 0.9, -1.4 + k * 0.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 0.9, 10]} /></mesh>)}
          <mesh material={M.dark} position={[0, 2.6, 2]}><sphereGeometry args={[0.4, 14, 10]} /></mesh>
        </group>
      ))}
      {/* discharge manifold + standpipe up the derrick */}
      <mesh material={M.supply} position={[-12, 2.9, 15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.15, 0.15, 22, 10]} /></mesh>
      <mesh material={M.supply} position={[-1, 2.9, 10]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 10, 10]} /></mesh>
      <mesh material={M.supply} position={[-1, 2.9, 5]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.3, 10]} /></mesh>
      <mesh material={M.supply} position={[-4.4, F + 12, 4.3]}><cylinderGeometry args={[0.12, 0.12, 24, 10]} /></mesh>
      <mesh material={M.supply} position={[-2.7, 2.9, 5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.15, 0.15, 3.4, 10]} /></mesh>
      <mesh material={M.supply} position={[-4.4, 1.5 + 0.05, 5]}><cylinderGeometry args={[0.15, 0.15, 3, 10]} /></mesh>
    </group>
  );
}

/** Doghouse: walls, window, hinged door, driller console, chair, live monitors, physical lever, beacon. */
export function Doghouse() {
  const door = useRef<THREE.Group>(null), lever = useRef<THREE.Group>(null), beacon = useRef<THREE.Mesh>(null), bl = useRef<THREE.PointLight>(null);
  const needles = useRef<THREE.Mesh[]>([]);
  const mode = useGame((s) => s.mode);
  const screens = useMemo(() => [0, 1, 2].map(() => { const c = document.createElement("canvas"); c.width = 640; c.height = 400; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, t, g: c.getContext("2d")! }; }), []);
  const acc = useRef(0), drag = useRef<{ y: number } | null>(null);
  const M = useMemo(() => ({ wall: std("#d9dbd2", { map: tex.container(), metalness: 0.3 }), roof: std("#8b938c"), frame: std("#3a4046"), floor: std("#4a5258", { roughness: 0.8 }), desk: std("#2b3237"), chair: std("#1e2226", { roughness: 0.7 }), seat: std("#3b3f44", { roughness: 0.9 }), glass: new THREE.MeshPhysicalMaterial({ color: "#a9c6d3", transmission: 0.85, roughness: 0.05, thickness: 0.05, transparent: true, opacity: 0.35 }), knob: std("#d43a2a"), door: std("#b0b6b2", { map: tex.container() }), metal: std("#c9cdd0", { metalness: 0.9, roughness: 0.25 }) }), []);

  useEffect(() => {
    const move = (e: PointerEvent) => { if (!drag.current) return; input.leverKey = 0; S.lever = clamp((drag.current.y - e.clientY) / 110, -1, 1); if (Math.abs(S.lever) < 0.08) S.lever = 0; };
    const up = () => { if (drag.current) { drag.current = null; S.lever = 0; } };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    doorState.open += (doorState.target - doorState.open) * Math.min(1, dt * 4);
    if (door.current) door.current.rotation.y = doorState.open * 1.7;
    if (lever.current) lever.current.rotation.z = -S.lever * 0.6;
    const vals = [S.spp / 5000, S.hook / 400, S.wob / 60, S.rpm / 150, S.casP / 5000];
    needles.current.forEach((n, i) => { if (n) n.rotation.z = 2.3 - clamp(vals[i] ?? 0, 0, 1) * 4.6; });
    const alarm = S.al.length > 0, on = alarm && Math.sin(S.t * 10) > 0;
    if (beacon.current) (beacon.current.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 3 : 0.2;
    if (bl.current) bl.current.intensity = on ? 8 : 0;
    acc.current += dt;
    if (acc.current > 0.25) { acc.current = 0; screens.forEach((s, i) => { drawMonitor(s.g, 640, 400, i); s.t.needsUpdate = true; }); }
  });

  const X0 = DH.x0, X1 = DH.x1, Z0 = DH.z0, Z1 = DH.z1, H = DH.h, cxm = (X0 + X1) / 2, czm = (Z0 + Z1) / 2;
  const wall = (p: [number, number, number], s: [number, number, number]) => <mesh material={M.wall} position={p} castShadow receiveShadow><boxGeometry args={s} /></mesh>;
  return (
    <group>
      <group position={[0, F, 0]}>
        <mesh material={M.floor} position={[cxm, 0.03, czm]} receiveShadow><boxGeometry args={[X1 - X0, 0.06, Z1 - Z0]} /></mesh>
        {wall([cxm, H / 2, Z0], [X1 - X0, H, 0.25])}
        {wall([cxm, H / 2, Z1], [X1 - X0, H, 0.25])}
        {wall([X1, H / 2, czm], [0.25, H, Z1 - Z0])}
        {/* west wall: low wall + big window toward the derrick + door opening */}
        {wall([X0, 0.55, (Z0 + DOOR.z0) / 2], [0.25, 1.1, DOOR.z0 - Z0])}
        {wall([X0, H - 0.3, (Z0 + DOOR.z0) / 2], [0.25, 0.6, DOOR.z0 - Z0])}
        <mesh material={M.glass} position={[X0, 1.75, (Z0 + DOOR.z0) / 2]}><boxGeometry args={[0.05, 1.3, DOOR.z0 - Z0]} /></mesh>
        {wall([X0, H / 2, (DOOR.z1 + Z1) / 2], [0.25, H, Z1 - DOOR.z1])}
        {wall([X0, H - 0.25, (DOOR.z0 + DOOR.z1) / 2], [0.25, 0.5, DOOR.z1 - DOOR.z0])}
        <mesh material={M.roof} position={[cxm, H + 0.1, czm]} castShadow><boxGeometry args={[X1 - X0 + 0.5, 0.2, Z1 - Z0 + 0.5]} /></mesh>
        {/* side window on north wall */}
        <mesh material={M.glass} position={[12.5, 1.8, Z0 + 0.14]}><boxGeometry args={[2.2, 1, 0.03]} /></mesh>
        {/* door (pivot on hinge at z1) */}
        <group ref={door} position={[X0, 0, DOOR.z1]}>
          <mesh material={M.door} position={[0, 1.35, -(DOOR.z1 - DOOR.z0) / 2]} castShadow><boxGeometry args={[0.08, 2.7, DOOR.z1 - DOOR.z0]} /></mesh>
          <mesh material={M.metal} position={[-0.08, 1.3, -(DOOR.z1 - DOOR.z0) + 0.15]}><boxGeometry args={[0.06, 0.06, 0.2]} /></mesh>
          <mesh material={M.glass} position={[0, 2, -(DOOR.z1 - DOOR.z0) / 2]}><boxGeometry args={[0.1, 0.5, 0.6]} /></mesh>
        </group>
        <Sign text="DOGHOUSE" p={[X0 - 0.16, H - 0.25, (DOOR.z0 + DOOR.z1) / 2]} r={-Math.PI / 2} size={0.22} />
        {/* interior light */}
        <pointLight position={[cxm, H - 0.3, czm]} intensity={6} distance={9} color="#fff3dd" />
        <mesh position={[cxm, H - 0.02, czm]}><boxGeometry args={[1.4, 0.04, 0.3]} /><meshStandardMaterial emissive="#fff6e0" emissiveIntensity={2} color="#fff" /></mesh>
        {/* driller console along the window */}
        <mesh material={M.desk} position={[9.1, 0.5, -2.3]} castShadow><boxGeometry args={[1.5, 1, 4.6]} /></mesh>
        <mesh material={M.desk} position={[9.35, 1.06, -2.3]} rotation={[0, 0, 0.35]}><boxGeometry args={[1.1, 0.1, 4.6]} /></mesh>
        {/* push buttons + emergency stop */}
        {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[9.45 + (i % 2) * 0.2, 1.14 - (i % 2) * 0.07, -4.2 + Math.floor(i / 2) * 0.3]}><cylinderGeometry args={[0.04, 0.04, 0.03, 10]} /><meshStandardMaterial color={["#2ecc71", "#e74c3c", "#f1c40f"][i % 3]!} emissive={["#2ecc71", "#e74c3c", "#f1c40f"][i % 3]!} emissiveIntensity={0.6} /></mesh>)}
        <mesh material={M.knob} position={[9.6, 1.12, -0.4]}><cylinderGeometry args={[0.09, 0.09, 0.06, 16]} /></mesh>
        {/* analogue gauges */}
        {["SPP", "HOOK", "WOB", "RPM", "CSG"].map((n, i) => (
          <group key={n} position={[8.35, 1.8, -4.15 + i * 0.5]} rotation={[0, Math.PI / 2, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.06, 24]} /><meshStandardMaterial color="#f2f2ea" /></mesh>
            <mesh ref={(m) => { if (m) needles.current[i] = m; }} position={[0, 0, 0.04]}><boxGeometry args={[0.02, 0.32, 0.01]} /><meshBasicMaterial color="#c0392b" /></mesh>
          </group>
        ))}
        {/* three live monitors */}
        {screens.map((s, i) => (
          <group key={i} position={[9.15, 1.55, -3.75 + i * 1.35]} rotation={[0, Math.PI / 2, 0]}>
            <mesh material={M.frame}><boxGeometry args={[1.3, 0.85, 0.06]} /></mesh>
            <mesh position={[0, 0, 0.035]}><planeGeometry args={[1.22, 0.77]} /><meshBasicMaterial map={s.t} toneMapped={false} /></mesh>
          </group>
        ))}
        {/* driller chair with armrest consoles */}
        <group position={[CHAIR.x, 0, CHAIR.z]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={M.metal} position={[0, 0.25, 0]}><cylinderGeometry args={[0.08, 0.3, 0.5, 12]} /></mesh>
          <mesh material={M.seat} position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.6, 0.14, 0.6]} /></mesh>
          <mesh material={M.seat} position={[0, 1.05, -0.32]} rotation={[-0.12, 0, 0]} castShadow><boxGeometry args={[0.6, 0.85, 0.12]} /></mesh>
          {[-1, 1].map((sd) => <mesh key={sd} material={M.chair} position={[sd * 0.45, 0.8, 0.05]} castShadow><boxGeometry args={[0.28, 0.12, 0.7]} /></mesh>)}
          {/* PHYSICAL TOP DRIVE LEVER (right armrest) */}
          <group ref={lever} position={[-0.45, 0.88, 0.2]} rotation={[0, Math.PI / 2, 0]}>
            <mesh material={M.metal} position={[0, 0.16, 0]}><cylinderGeometry args={[0.022, 0.022, 0.32, 8]} /></mesh>
            <mesh position={[0, 0.34, 0]} onPointerDown={(e) => { e.stopPropagation(); drag.current = { y: e.nativeEvent.clientY + S.lever * 110 }; }}
              onPointerOver={() => { document.body.style.cursor = "grab"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
              <sphereGeometry args={[mode === "seated" ? 0.06 : 0.05, 14, 10]} /><meshStandardMaterial color="#e53935" roughness={0.35} />
            </mesh>
          </group>
          <mesh material={M.chair} position={[0.45, 0.92, 0.25]}><boxGeometry args={[0.12, 0.1, 0.12]} /></mesh>
        </group>
      </group>
      {/* alarm beacon on the roof */}
      <mesh ref={beacon} position={[DH.x0 + 0.6, F + DH.h + 0.4, DH.z0 + 0.6]}><cylinderGeometry args={[0.15, 0.15, 0.3, 12]} /><meshStandardMaterial color="#ff3b2f" emissive="#ff2a1a" emissiveIntensity={0.2} /></mesh>
      <pointLight ref={bl} position={[DH.x0 + 0.6, F + DH.h + 0.9, DH.z0 + 0.6]} color="#ff2a1a" intensity={0} distance={18} />
    </group>
  );
}
