import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface LuxuryBoxProps {
  isOpen: boolean;
}

export const LuxuryBox = ({ isOpen }: LuxuryBoxProps) => {
  const lidGroupRef = useRef<THREE.Group>(null);
  const currentAngle = useRef(isOpen ? 1.85 : 0);

  // Smooth lid opening/closing physics
  useFrame((_, delta) => {
    if (lidGroupRef.current) {
      const targetAngle = isOpen ? 1.85 : 0;
      currentAngle.current = THREE.MathUtils.damp(
        currentAngle.current,
        targetAngle,
        4.5,
        delta
      );
      lidGroupRef.current.rotation.x = -currentAngle.current;
    }
  });

  // Dynamic canvas texture for gold embossed crest inside lid
  const interiorLidTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#2A060C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold frame
    ctx.strokeStyle = 'rgba(226, 195, 122, 0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Brand crest
    ctx.fillStyle = '#E2C37A';
    ctx.font = '600 48px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦  A U R U M  ✦', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '300 24px Montserrat, sans-serif';
    ctx.fillStyle = 'rgba(226, 195, 122, 0.85)';
    ctx.fillText('HAUTE JOAILLERIE • PLACE VENDÔME', canvas.width / 2, canvas.height / 2 + 35);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <group position={[0, -1.05, 0]}>
      {/* Box Base (Lower Half) - Imperial Bordeaux Velvet */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.2, 3.2]} />
        <meshStandardMaterial
          color="#380810"
          roughness={0.92}
          metalness={0.15}
        />
      </mesh>

      {/* Gold Trim along Box Rim */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.25, 0.05, 3.25]} />
        <meshPhysicalMaterial
          color="#E2C37A"
          metalness={0.98}
          roughness={0.15}
        />
      </mesh>

      {/* Interior Plush Velvet Cushion */}
      <mesh position={[0, 0.52, 0]} receiveShadow>
        <boxGeometry args={[2.95, 0.25, 2.95]} />
        <meshStandardMaterial
          color="#22040A"
          roughness={0.96}
          metalness={0.08}
        />
      </mesh>

      {/* Ring Slot in Center of Cushion */}
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[1.5, 0.12, 0.18]} />
        <meshStandardMaterial color="#140206" roughness={1} />
      </mesh>

      {/* Front Gold Clasp / Latch */}
      <mesh position={[0, 0.35, 1.62]}>
        <boxGeometry args={[0.3, 0.25, 0.06]} />
        <meshPhysicalMaterial
          color="#E2C37A"
          metalness={0.99}
          roughness={0.12}
        />
      </mesh>

      {/* Hinged Box Lid (Upper Half) */}
      <group position={[0, 0.6, -1.6]} ref={lidGroupRef}>
        {/* Lid Body */}
        <mesh position={[0, 0.6, 1.6]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.2, 3.2]} />
          <meshStandardMaterial
            color="#380810"
            roughness={0.92}
            metalness={0.15}
          />
        </mesh>

        {/* Lid Gold Edge Trim */}
        <mesh position={[0, 0.02, 1.6]}>
          <boxGeometry args={[3.25, 0.05, 3.25]} />
          <meshPhysicalMaterial
            color="#E2C37A"
            metalness={0.98}
            roughness={0.15}
          />
        </mesh>

        {/* Interior Lid Satin Crest Lining */}
        {interiorLidTexture && (
          <mesh position={[0, 0.06, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.9, 2.9]} />
            <meshStandardMaterial
              map={interiorLidTexture}
              roughness={0.6}
            />
          </mesh>
        )}

        {/* Gold Hinges at the Back */}
        {[-1.0, 1.0].map((hx, idx) => (
          <mesh key={idx} position={[hx, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 16]} />
            <meshPhysicalMaterial
              color="#E2C37A"
              metalness={0.98}
              roughness={0.15}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
