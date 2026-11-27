import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment as Env, Lightformer, Sky } from "@react-three/drei";
import * as THREE from "three";
import { player, useGame } from "@/game/store";

/** Late-afternoon North Sea light: warm low sun, cool sky fill, hazy horizon. */
export function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const quality = useGame((s) => s.quality);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = sun.current; if (!l) return;
    // shadow frustum follows the player for crisp local shadows
    target.position.set(player.x, player.y, player.z);
    l.position.set(player.x + 40, player.y + 55, player.z + 25);
    target.updateMatrixWorld();
  });
  return (
    <>
      <Sky distance={4500} sunPosition={[-30, 8, 5]} turbidity={9} rayleigh={0.9} mieCoefficient={0.009} mieDirectionalG={0.82} />
      <fog attach="fog" args={["#9eabb0", 48, 310]} />
      <hemisphereLight args={["#d4e0e5", "#343b3c", 0.62]} />
      <primitive object={target} />
      <directionalLight ref={sun} target={target} color="#d4e0e4" intensity={1.65} castShadow={quality === "high"}
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={160} shadow-bias={-0.0004} shadow-normalBias={0.04} />
      <Env resolution={128} frames={1}>
        <Lightformer intensity={1.35} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} color="#dbe5e8" />
        <Lightformer intensity={1.2} position={[10, 2, 4]} rotation-y={-Math.PI / 2} scale={[20, 3, 1]} color="#d6d8d2" />
        <Lightformer intensity={1.05} position={[-10, 1, -2]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} color="#8aa9b8" />
      </Env>
    </>
  );
}

/** GPU-displaced ocean (waves in the vertex shader of a standard material). */
export function Ocean() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(1600, 1600, 220, 220); g.rotateX(-Math.PI / 2); return g; }, []);
  useFrame((_, d) => { uniforms.uTime.value += Math.min(d, 0.05); });
  return (
    <mesh geometry={geo} position={[0, -16, 0]} receiveShadow>
      <meshStandardMaterial ref={mat} color="#1d4253" roughness={0.18} metalness={0.25}
        onBeforeCompile={(sh) => {
          sh.uniforms["uTime"] = uniforms.uTime;
          sh.vertexShader = sh.vertexShader
            .replace("#include <common>", `#include <common>
uniform float uTime;
varying float vWaveHeight;
vec3 wave(vec2 p){
  float h=0.; vec2 g=vec2(0.);
  vec4 W[4]; W[0]=vec4(1.,.3,0.06,1.6); W[1]=vec4(-.4,1.,0.09,1.1); W[2]=vec4(.7,-.6,0.16,.55); W[3]=vec4(-.9,-.2,0.23,.35);
  for(int i=0;i<4;i++){ vec2 d=normalize(W[i].xy); float k=W[i].z; float a=W[i].w; float ph=dot(d,p)*k+uTime*sqrt(9.8*k);
    h+=a*sin(ph); g+=a*k*cos(ph)*d; }
  return vec3(h,g);
}`)
            .replace("#include <beginnormal_vertex>", `vec3 wv=wave(position.xz); vec3 objectNormal=normalize(vec3(-wv.y,1.,-wv.z)); vWaveHeight=wv.x;`)
            .replace("#include <begin_vertex>", `vec3 transformed=position; transformed.y+=wv.x;`);
          sh.fragmentShader = sh.fragmentShader
            .replace("#include <common>", `#include <common>
varying float vWaveHeight;`)
            .replace("#include <color_fragment>", `#include <color_fragment>
float crest = smoothstep(1.55, 2.65, vWaveHeight);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.47, 0.67, 0.69), crest * 0.48);
float trough = smoothstep(-2.1, -0.25, -vWaveHeight);
diffuseColor.rgb *= mix(0.88, 1.0, trough);`);
        }} />
    </mesh>
  );
}
