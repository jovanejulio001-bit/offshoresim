import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Seg = [number, number, number, number, number, number, number?];
/** Many square beams between point pairs in one instanced draw call. */
export function Beams({ segs, color = "#b9452c", size = 0.18, map, metalness = 0.6, roughness = 0.55 }: { segs: Seg[]; color?: string; size?: number; map?: THREE.Texture; metalness?: number; roughness?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const o = new THREE.Object3D(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    segs.forEach((s, i) => {
      a.set(s[0], s[1], s[2]); b.set(s[3], s[4], s[5]);
      const len = a.distanceTo(b), w = s[6] ?? size;
      o.position.copy(a).add(b).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
      o.scale.set(w, len, w); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere();
  }, [segs, size]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, segs.length]} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} {...(map ? { map } : {})} />
    </instancedMesh>
  );
}

/** Railing segments along a polyline at height y. */
export function railSegs(pts: [number, number][], y: number, h = 1.1): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i]!, [x1, z1] = pts[i + 1]!;
    out.push([x0, y + h, z0, x1, y + h, z1, 0.06], [x0, y + h * 0.5, z0, x1, y + h * 0.5, z1, 0.05]);
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.6));
    for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; out.push([x, y, z, x, y + h, z, 0.06]); }
  }
  return out;
}
