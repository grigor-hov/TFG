import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export default function GoFa3D({ joints = [0, 0, 0, 0, 0, 0], transparent = false, }) {
  const { scene } = useGLTF("/models/gofa_test.glb");

  const base = scene.getObjectByName("base_link");
  const link1 = scene.getObjectByName("link_1");
  const link2 = scene.getObjectByName("link_2");
  const link3 = scene.getObjectByName("link_3");
  const link4 = scene.getObjectByName("link_4");
  const link5 = scene.getObjectByName("link_5");
  const link6 = scene.getObjectByName("link_6");

  const q = joints;

  const renderPart = (part) => {
    if (!part) return null;

    const cloned = part.clone();

    if (transparent) {
      cloned.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.35;
          child.material.depthWrite = false;
        }
      });
    }

    return <primitive object={cloned} />;
  };

  return (
  <>
    <group position={[-0.1, -0.7, 0]} scale={1.4}>
      {base && <primitive object={base.clone()} />}

      <group position={[0, 0.265, 0]} rotation={[0, q[0], 0]}>
        {link1 && <primitive object={link1.clone()} />}

        <group position={[0, 0, 0]} rotation={[0, 0, -q[1]]}>
          {link2 && <primitive object={link2.clone()} />}

          <group position={[0, 0.444, 0]} rotation={[0, 0, -q[2]]}>
            {link3 && <primitive object={link3.clone()} />}

            <group position={[0, 0.110, 0]} rotation={[q[3], 0, 0]}>
              {link4 && <primitive object={link4.clone()} />}

              <group
                position={[0.470, 0, 0]}
                rotation={[0, 0, -q[4]]}
              >
                {link5 && <primitive object={link5.clone()} />}

                <group position={[0.101, 0.080, 0]} rotation={[q[5], 0, 0]}>
                  {link6 && <primitive object={link6.clone()} />}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>

    <OrbitControls />
  </>
);
}