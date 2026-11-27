import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Anim = "idle" | "walk" | "run" | "sit" | "operate" | "wrench" | "inspect" | "rack" | "wave";
export interface Pose { x: number; y: number; z: number; heading: number; anim: Anim; speed: number }

interface Joints { hips: THREE.Group; torso: THREE.Group; head: THREE.Group; lArm: THREE.Group; rArm: THREE.Group; lFore: THREE.Group; rFore: THREE.Group; lLeg: THREE.Group; rLeg: THREE.Group; lShin: THREE.Group; rShin: THREE.Group }

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Articulated offshore worker (coverall, hard hat, reflective bands) with procedural animation blending. */
export function Character({ pose, suit = "#e2611d", hat = "#f4f4f0", ...rest }: { pose: MutableRefObject<Pose>; suit?: string; hat?: string; visible?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const j = useRef<Partial<Joints>>({});
  const phase = useRef(Math.random() * 10);
  const cur = useRef<Record<string, number>>({});
  const set = (k: keyof Joints) => (g: THREE.Group | null) => { if (g) j.current[k] = g; };

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05), p = pose.current, r = root.current, J = j.current as Joints;
    if (!r || !J.hips) return;
    r.position.set(p.x, p.y, p.z);
    let dh = p.heading - r.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    r.rotation.y += dh * Math.min(1, dt * 12);
    const sp = p.speed; phase.current += dt * (p.anim === "run" ? 11 : p.anim === "walk" ? 7.5 : 4);
    const ph = phase.current, s = Math.sin(ph), c = Math.cos(ph);
    // target joint angles
    type JK = "hipY"|"torsoX"|"lArm"|"rArm"|"lArmZ"|"rArmZ"|"lFore"|"rFore"|"lLeg"|"rLeg"|"lShin"|"rShin"|"headX"|"headY";
    const T: Record<JK, number> = { hipY: 0.95, torsoX: 0, lArm: 0, rArm: 0, lArmZ: 0.12, rArmZ: -0.12, lFore: -0.15, rFore: -0.15, lLeg: 0, rLeg: 0, lShin: 0, rShin: 0, headX: 0, headY: 0 };
    const a = p.anim;
    if (a === "walk" || a === "run") {
      const run = a === "run", k = Math.min(1, sp / (run ? 6 : 2.5)), amp = (run ? 0.95 : 0.55) * k;
      T.lLeg = s * amp; T.rLeg = -s * amp; T.lShin = Math.max(0, -c) * amp * 1.5; T.rShin = Math.max(0, c) * amp * 1.5;
      T.lArm = -s * amp * 0.9; T.rArm = s * amp * 0.9; T.lFore = run ? -1.3 : -0.35; T.rFore = run ? -1.3 : -0.35;
      T.torsoX = run ? 0.22 : 0.05; T.hipY = 0.95 + Math.abs(s) * (run ? 0.07 : 0.03);
    } else if (a === "sit") {
      T.hipY = 0.62; T.lLeg = -1.5; T.rLeg = -1.5; T.lShin = 1.5; T.rShin = 1.5; T.lArm = -0.7; T.rArm = -0.9 + Math.sin(ph * 0.7) * 0.15; T.lFore = -0.8; T.rFore = -0.7; T.torsoX = 0.08;
    } else if (a === "operate") {
      T.lArm = -1.0; T.rArm = -1.1 + s * 0.25; T.lFore = -0.6; T.rFore = -0.5 + c * 0.2; T.torsoX = 0.15; T.headX = 0.15;
    } else if (a === "wrench") {
      T.torsoX = 0.45; T.lArm = -1.2 + s * 0.4; T.rArm = -1.2 + s * 0.4; T.lFore = -0.3; T.rFore = -0.3; T.lLeg = 0.3; T.rLeg = -0.25; T.hipY = 0.9;
    } else if (a === "inspect") {
      T.torsoX = 0.35 + s * 0.05; T.rArm = -1.3; T.rFore = -0.2; T.lArm = 0.1; T.headX = 0.3; T.headY = Math.sin(ph * 0.5) * 0.5;
    } else if (a === "rack") {
      T.lArm = -2.2 + s * 0.5; T.rArm = -2.0 + s * 0.5; T.lFore = -0.4; T.rFore = -0.4; T.torsoX = -0.05 + s * 0.08;
    } else if (a === "wave") {
      T.rArm = -2.6; T.rArmZ = -0.4 + s * 0.4; T.rFore = -0.5;
    } else {
      T.torsoX = Math.sin(ph * 0.5) * 0.02; T.hipY = 0.95 + Math.sin(ph * 0.5) * 0.006; T.headY = Math.sin(ph * 0.13) * 0.4;
    }
    const C = cur.current, k = Math.min(1, dt * 10);
    for (const key of Object.keys(T) as JK[]) C[key] = lerp(C[key] ?? T[key], T[key], k);
    J.hips.position.y = C["hipY"]!; J.torso.rotation.x = C["torsoX"]!; J.head.rotation.set(C["headX"]!, C["headY"]!, 0);
    J.lArm.rotation.set(C["lArm"]!, 0, C["lArmZ"]!); J.rArm.rotation.set(C["rArm"]!, 0, C["rArmZ"]!);
    J.lFore.rotation.x = C["lFore"]!; J.rFore.rotation.x = C["rFore"]!;
    J.lLeg.rotation.x = C["lLeg"]!; J.rLeg.rotation.x = C["rLeg"]!; J.lShin.rotation.x = C["lShin"]!; J.rShin.rotation.x = C["rShin"]!;
  });

  const suitM = <meshStandardMaterial color={suit} roughness={0.85} />;
  const band = <meshStandardMaterial color="#d9e4e8" emissive="#6c7a80" emissiveIntensity={0.25} roughness={0.3} metalness={0.4} />;
  const boot = <meshStandardMaterial color="#1d1a17" roughness={0.7} />;
  const skin = <meshStandardMaterial color="#c89272" roughness={0.75} />;
  const glove = <meshStandardMaterial color="#e8d23a" roughness={0.8} />;
  const trim = <meshStandardMaterial color="#252b2e" roughness={0.72} />;
  const metal = <meshStandardMaterial color="#aeb9bd" metalness={0.72} roughness={0.28} />;
  const visor = <meshStandardMaterial color="#18232a" metalness={0.78} roughness={0.2} />;
  const limb = (len: number, rad: number, m: React.ReactNode) => (
    <mesh position={[0, -len / 2, 0]} castShadow><capsuleGeometry args={[rad, len - rad * 2, 4, 10]} />{m}</mesh>
  );
  return (
    <group ref={root} {...rest}>
      <group ref={set("hips")} position={[0, 0.95, 0]}>
        <mesh castShadow position={[0, 0, 0]}><boxGeometry args={[0.36, 0.2, 0.22]} />{suitM}</mesh>
        {([-1, 1] as const).map((sd) => (
          <group key={sd} ref={set(sd < 0 ? "lLeg" : "rLeg")} position={[sd * 0.1, -0.06, 0]}>
            {limb(0.46, 0.085, suitM)}
            <mesh position={[0, -0.22, 0.076]}><boxGeometry args={[0.13, 0.045, 0.012]} />{band}</mesh>
            <group ref={set(sd < 0 ? "lShin" : "rShin")} position={[0, -0.44, 0]}>
              {limb(0.44, 0.075, suitM)}
              <mesh position={[0, -0.17, 0.069]}><boxGeometry args={[0.12, 0.045, 0.012]} />{band}</mesh>
              <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.08, 0.08, 0.04, 10]} />{band}</mesh>
              <group position={[0, -0.45, 0.05]}>
                <mesh castShadow><boxGeometry args={[0.14, 0.13, 0.29]} />{boot}</mesh>
                <mesh position={[0, -0.055, 0.015]}><boxGeometry args={[0.145, 0.025, 0.3]} />{trim}</mesh>
                <mesh position={[0, 0.025, 0.115]}><boxGeometry args={[0.11, 0.055, 0.025]} />{metal}</mesh>
              </group>
            </group>
          </group>
        ))}
        <group ref={set("torso")} position={[0, 0.08, 0]}>
          <mesh castShadow position={[0, 0.27, 0]}><capsuleGeometry args={[0.19, 0.28, 4, 12]} />{suitM}</mesh>
          {/* Workwear seams, reflective harness and utility belt */}
          <mesh position={[0, 0.32, 0.195]}><boxGeometry args={[0.055, 0.49, 0.018]} />{metal}</mesh>
          <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.205, 0.205, 0.055, 16]} />{trim}</mesh>
          <mesh position={[0, 0.08, 0.208]}><boxGeometry args={[0.09, 0.07, 0.025]} />{metal}</mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 14]} />{band}</mesh>
          <mesh position={[0, 0.36, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 14]} />{band}</mesh>
          <mesh position={[-0.105, 0.31, 0.18]} castShadow><boxGeometry args={[0.11, 0.14, 0.045]} />{suitM}</mesh>
          <mesh position={[0.105, 0.31, 0.18]} castShadow><boxGeometry args={[0.11, 0.14, 0.045]} />{suitM}</mesh>
          <mesh position={[-0.105, 0.31, 0.206]}><boxGeometry args={[0.07, 0.012, 0.009]} />{metal}</mesh>
          <mesh position={[0.105, 0.31, 0.206]}><boxGeometry args={[0.07, 0.012, 0.009]} />{metal}</mesh>
          <mesh position={[0, 0.3, -0.19]} castShadow><boxGeometry args={[0.26, 0.3, 0.08]} /><meshStandardMaterial color="#2e3236" /></mesh>
          {/* Shoulder-mounted radio and aerial */}
          <mesh castShadow position={[-0.16, 0.47, 0.12]}><boxGeometry args={[0.09, 0.15, 0.08]} />{trim}</mesh>
          <mesh position={[-0.16, 0.57, 0.12]} rotation={[0, 0, -0.12]}><cylinderGeometry args={[0.008, 0.012, 0.1, 6]} />{metal}</mesh>
          <mesh position={[-0.16, 0.48, 0.164]}><boxGeometry args={[0.026, 0.026, 0.008]} /><meshStandardMaterial color="#42c789" emissive="#42c789" emissiveIntensity={0.8} /></mesh>
          <group ref={set("head")} position={[0, 0.62, 0]}>
            <mesh castShadow position={[0, 0.06, 0]}><sphereGeometry args={[0.12, 16, 12]} />{skin}</mesh>
            <mesh position={[0, 0.06, 0.102]}><boxGeometry args={[0.16, 0.052, 0.045]} />{visor}</mesh>
            <mesh position={[-0.09, 0.06, 0]}><sphereGeometry args={[0.035, 10, 8]} />{trim}</mesh>
            <mesh position={[0.09, 0.06, 0]}><sphereGeometry args={[0.035, 10, 8]} />{trim}</mesh>
            <mesh castShadow position={[0, 0.14, 0]}><sphereGeometry args={[0.145, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={hat} roughness={0.35} /></mesh>
            <mesh position={[0, 0.14, 0.02]}><cylinderGeometry args={[0.175, 0.175, 0.02, 18]} /><meshStandardMaterial color={hat} roughness={0.35} /></mesh>
            <mesh position={[0, 0.145, 0.135]}><boxGeometry args={[0.07, 0.025, 0.055]} />{metal}</mesh>
            <mesh position={[0, 0.145, 0.166]}><boxGeometry args={[0.045, 0.018, 0.012]} /><meshStandardMaterial color="#fff0a8" emissive="#fff0a8" emissiveIntensity={0.7} /></mesh>
          </group>
          {([-1, 1] as const).map((sd) => (
            <group key={sd} ref={set(sd < 0 ? "lArm" : "rArm")} position={[sd * 0.25, 0.45, 0]}>
              {limb(0.32, 0.065, suitM)}
              <mesh position={[0, -0.17, 0.058]}><boxGeometry args={[0.11, 0.04, 0.012]} />{band}</mesh>
              <group ref={set(sd < 0 ? "lFore" : "rFore")} position={[0, -0.3, 0]}>
                {limb(0.3, 0.058, suitM)}
                <mesh position={[0, -0.17, 0.052]}><boxGeometry args={[0.1, 0.04, 0.012]} />{band}</mesh>
                <mesh castShadow position={[0, -0.33, 0]}><sphereGeometry args={[0.065, 10, 8]} />{glove}</mesh>
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
