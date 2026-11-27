import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DECK } from "@/game/world";

/** Semi-submersible hull from the reference image: yellow/black columns, pontoon ring, flare boom and second crane. */
const YEL = "#e6c63a", BLK = "#2b2c2e", STEEL = "#8d9296";

function Lattice({ len, w = 1.2, color = STEEL }: { len: number; w?: number; color?: string }) {
  const n = Math.max(2, Math.round(len / 1.6)), m = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.5 }), [color]);
  const h = w / 2;
  return (
    <group>
      {([[-h, -h], [h, -h], [-h, h], [h, h]] as [number, number][]).map(([x, z], i) => <mesh key={i} material={m} position={[x, len / 2, z]} castShadow><boxGeometry args={[0.12, len, 0.12]} /></mesh>)}
      {Array.from({ length: n }, (_, i) => {
        const y = (i + 0.5) * (len / n), d = Math.hypot(w, len / n);
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh material={m} position={[0, 0, h]} rotation={[0, 0, Math.atan2(w, len / n)]}><boxGeometry args={[0.06, d, 0.06]} /></mesh>
            <mesh material={m} position={[0, 0, -h]} rotation={[0, 0, -Math.atan2(w, len / n)]}><boxGeometry args={[0.06, d, 0.06]} /></mesh>
            <mesh material={m} position={[h, 0, 0]} rotation={[Math.atan2(w, len / n), 0, 0]}><boxGeometry args={[0.06, d, 0.06]} /></mesh>
            <mesh material={m} position={[-h, 0, 0]} rotation={[-Math.atan2(w, len / n), 0, 0]}><boxGeometry args={[0.06, d, 0.06]} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

export function RigExterior() {
  const flame = useRef<THREE.Mesh>(null), fl = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, k = 1 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.08;
    if (flame.current) flame.current.scale.set(k, k * 1.3, k);
    if (fl.current) fl.current.intensity = 60 * k;
  });
  const cols: [number, number][] = [[DECK.x0 + 5, DECK.z0 + 5], [DECK.x1 - 5, DECK.z0 + 5], [DECK.x0 + 5, DECK.z1 - 5], [DECK.x1 - 5, DECK.z1 - 5]];
  const W = DECK.x1 - DECK.x0 - 10, D = DECK.z1 - DECK.z0 - 10, cx = (DECK.x0 + DECK.x1) / 2, cz = (DECK.z0 + DECK.z1) / 2;
  const yel = <meshStandardMaterial color={YEL} roughness={0.65} metalness={0.2} />;
  const blk = <meshStandardMaterial color={BLK} roughness={0.8} />;
  return (
    <group>
      {/* columns: yellow above, black band at the waterline */}
      {cols.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, -6, 0]} castShadow><boxGeometry args={[7, 11, 7]} />{yel}</mesh>
          <mesh position={[0, -14.5, 0]}><boxGeometry args={[7.05, 6, 7.05]} />{blk}</mesh>
          <mesh position={[3.56, -5, 0]}><boxGeometry args={[0.1, 6, 0.6]} /><meshStandardMaterial color="#c7a92c" /></mesh>
          <mesh position={[-3.2, -8, 3.6]}><cylinderGeometry args={[0.35, 0.35, 12, 10]} />{blk}</mesh>
        </group>
      ))}
      {/* pontoon ring */}
      <mesh position={[cx, -17, DECK.z0 + 5]}><boxGeometry args={[W + 7, 3, 6]} />{blk}</mesh>
      <mesh position={[cx, -17, DECK.z1 - 5]}><boxGeometry args={[W + 7, 3, 6]} />{blk}</mesh>
      <mesh position={[DECK.x0 + 5, -17, cz]}><boxGeometry args={[6, 3, D]} />{blk}</mesh>
      <mesh position={[DECK.x1 - 5, -17, cz]}><boxGeometry args={[6, 3, D]} />{blk}</mesh>
      {/* diagonal braces between columns */}
      {[[DECK.z0 + 5], [DECK.z1 - 5]].map(([z], i) => (
        <mesh key={i} position={[cx, -9, z!]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.6, 0.6, W, 12]} />{yel}</mesh>
      ))}
      {/* flare boom angled out over the sea, like the reference */}
      <group position={[DECK.x1 - 2, 1, DECK.z0 + 6]} rotation={[0.25, 0, -0.75]}>
        <Lattice len={30} w={1.6} />
        <group position={[0, 30.5, 0]}>
          <mesh><cylinderGeometry args={[0.35, 0.45, 1.2, 10]} /><meshStandardMaterial color={BLK} /></mesh>
          <mesh ref={flame} position={[0, 1.6, 0]}><coneGeometry args={[0.9, 3, 12]} /><meshStandardMaterial color="#ff7a1a" emissive="#ff5a00" emissiveIntensity={4} transparent opacity={0.85} /></mesh>
          <mesh position={[0.8, 4.5, 0]}><sphereGeometry args={[1.6, 12, 10]} /><meshStandardMaterial color="#2a2522" transparent opacity={0.55} roughness={1} /></mesh>
          <pointLight ref={fl} position={[0, 2, 0]} color="#ff8a3a" distance={40} />
        </group>
      </group>
      {/* second crane (port side), lattice boom with hook */}
      <group position={[DECK.x0 + 4, 0, DECK.z1 - 8]}>
        <mesh position={[0, 6, 0]} castShadow><cylinderGeometry args={[1.3, 1.5, 12, 16]} />{yel}</mesh>
        <group position={[0, 12.6, 0]} rotation={[0, 0.9, 0]}>
          <mesh position={[0, 0.8, 0]}><boxGeometry args={[2.6, 1.8, 2.6]} />{yel}</mesh>
          <mesh position={[0.9, 1, 1.35]}><boxGeometry args={[0.9, 0.9, 0.1]} /><meshStandardMaterial color="#9ec3d4" metalness={0.6} roughness={0.1} /></mesh>
          <group position={[0, 1.4, 0.6]} rotation={[1.0, 0, 0]}><Lattice len={22} w={1.3} color={YEL} /></group>
          <mesh position={[0, 12.5, 12.5]}><cylinderGeometry args={[0.03, 0.03, 12, 4]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[0, 6.5, 12.5]}><boxGeometry args={[0.5, 0.6, 0.5]} /><meshStandardMaterial color="#d33" /></mesh>
        </group>
      </group>
    </group>
  );
}
