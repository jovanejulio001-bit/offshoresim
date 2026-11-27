import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/offshore-platform.glb";
const PLATFORM_SPAN = 56;
const MODEL_DECK_Y = -0.0361;

/** Loads the reference-based model, scales it to the existing deck, and aligns the deck anchor to y=0. */
export function OffshorePlatform() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const root = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const horizontalSpan = Math.max(size.x, size.z);
    const scale = horizontalSpan > 0 ? PLATFORM_SPAN / horizontalSpan : 1;

    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -MODEL_DECK_Y * scale, -center.z * scale);
    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return root;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}

useGLTF.preload(MODEL_URL);
