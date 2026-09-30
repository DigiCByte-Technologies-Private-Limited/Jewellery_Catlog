import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createEngravingTexture } from './EngravingTexture';
import { LuxuryBox } from './LuxuryBox';

export type MetalType = 'yellow-gold' | 'rose-gold' | 'platinum';
export type GemType = 'diamond' | 'sapphire' | 'emerald' | 'ruby';
export type DisplayMode = 'pedestal' | 'box';
export type ProngStyle = '4-claw' | '6-claw';

interface JewelryModelProps {
  metal: MetalType;
  gem: GemType;
  modelType: 'solitaire-ring' | 'emerald-ring' | 'solitaire-bracelet';
  isRotating?: boolean;
  carat?: number;
  engravingText?: string;
  engravingFont?: 'roman' | 'script';
  prongStyle?: ProngStyle;
  displayMode?: DisplayMode;
  isBoxOpen?: boolean;
}

const METAL_CONFIGS: Record<MetalType, { color: string; metalness: number; roughness: number }> = {
  'yellow-gold': { color: '#E2C37A', metalness: 0.98, roughness: 0.12 },
  'rose-gold': { color: '#E59F89', metalness: 0.97, roughness: 0.14 },
  'platinum': { color: '#EFF1F5', metalness: 0.99, roughness: 0.07 },
};

const GEM_CONFIGS: Record<GemType, { color: string; transmission: number; ior: number; roughness: number }> = {
  'diamond': { color: '#ffffff', transmission: 0.98, ior: 2.417, roughness: 0.005 },
  'sapphire': { color: '#0f2b69', transmission: 0.88, ior: 1.77, roughness: 0.03 },
  'emerald': { color: '#046a4e', transmission: 0.90, ior: 1.58, roughness: 0.03 },
  'ruby': { color: '#9f1239', transmission: 0.89, ior: 1.76, roughness: 0.03 },
};

export const JewelryModel = ({
  metal,
  gem,
  modelType,
  isRotating = true,
  carat = 2.5,
  engravingText = '',
  engravingFont = 'roman',
  prongStyle = '4-claw',
  displayMode = 'pedestal',
  isBoxOpen = true,
}: JewelryModelProps) => {
  const groupRef = useRef<THREE.Group>(null);

  const metalConfig = METAL_CONFIGS[metal];
  const gemConfig = GEM_CONFIGS[gem];

  // Mathematical Carat Volume to Radius Scaling Factor
  const stoneScale = useMemo(() => {
    return Math.pow(carat / 2.5, 0.38);
  }, [carat]);

  // Procedural Brilliant Cut Diamond Geometry
  const brilliantDiamondGeometry = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.55, 0.02, 0.7, 16, 3, false);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Emerald Cut Geometry
  const emeraldDiamondGeometry = useMemo(() => {
    const geom = new THREE.BoxGeometry(0.9, 0.65, 0.7, 2, 2, 2);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Accent Pavé Stones Geometry
  const paveGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.06, 8, 8);
  }, []);

  // Shared high-specular diamond material for pavé accents (avoids per-mesh transmission pass overhead)
  const paveMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.02,
      metalness: 0.95,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      reflectivity: 1,
    });
  }, []);

  // Dynamic Inner Band Engraving Texture
  const engravingTexture = useMemo(() => {
    if (!engravingText || engravingText.trim() === '') return null;
    return createEngravingTexture(engravingText, engravingFont);
  }, [engravingText, engravingFont]);

  // Gently float / rotate when enabled
  useFrame((state, delta) => {
    if (groupRef.current) {
      if (isRotating && displayMode === 'pedestal') {
        groupRef.current.rotation.y += delta * 0.35;
      }
      if (displayMode === 'pedestal') {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
      } else {
        groupRef.current.position.y = 0;
      }
    }
  });

  // Calculate claw prong angles based on prongStyle
  const prongAngles = useMemo(() => {
    if (prongStyle === '6-claw') {
      return [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
    }
    return [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  }, [prongStyle]);

  const ringPosition: [number, number, number] = displayMode === 'box' ? [0, -0.45, 0] : [0, -0.2, 0];
  const ringRotation: [number, number, number] = displayMode === 'box' ? [0.4, 0.3, 0] : [0.2, 0, 0];

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {modelType === 'solitaire-ring' && (
        <group position={ringPosition} rotation={ringRotation}>
          {/* Main Band */}
          <mesh castShadow receiveShadow>
            <torusGeometry args={[1.1, 0.12, 32, 64]} />
            <meshPhysicalMaterial
              color={metalConfig.color}
              metalness={metalConfig.metalness}
              roughness={metalConfig.roughness}
              clearcoat={0.9}
              clearcoatRoughness={0.1}
              reflectivity={1}
            />
          </mesh>

          {/* Inner Band Laser Engraving Cylinder Sleeve */}
          {engravingTexture ? (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.97, 0.97, 0.2, 64, 1, true]} />
              <meshStandardMaterial
                map={engravingTexture}
                transparent
                roughness={0.2}
                metalness={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>
          ) : (
            <mesh>
              <torusGeometry args={[1.08, 0.05, 16, 64]} />
              <meshPhysicalMaterial
                color={metalConfig.color}
                metalness={metalConfig.metalness}
                roughness={metalConfig.roughness + 0.1}
              />
            </mesh>
          )}

          {/* Crown / Basket Setting at the top of the ring */}
          <group position={[0, 1.15, 0]}>
            {/* Gallery Rail Ring */}
            <mesh position={[0, 0.12 * stoneScale, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.42 * stoneScale, 0.035, 16, 32]} />
              <meshPhysicalMaterial
                color={metalConfig.color}
                metalness={metalConfig.metalness}
                roughness={metalConfig.roughness}
              />
            </mesh>

            {/* Majestic Claws / Prongs (4 or 6 prongs) */}
            {prongAngles.map((angle, i) => {
              const radius = 0.44 * stoneScale;
              const x = Math.sin(angle) * radius;
              const z = Math.cos(angle) * radius;
              return (
                <mesh
                  key={i}
                  position={[x, 0.28 * stoneScale, z]}
                  rotation={[0.15 * Math.cos(angle), 0, -0.15 * Math.sin(angle)]}
                >
                  <cylinderGeometry args={[0.038, 0.05, 0.55 * stoneScale, 12]} />
                  <meshPhysicalMaterial
                    color={metalConfig.color}
                    metalness={metalConfig.metalness}
                    roughness={metalConfig.roughness}
                  />
                </mesh>
              );
            })}

            {/* Center Solitaire Diamond with dynamic Carat scaling */}
            <mesh
              geometry={brilliantDiamondGeometry}
              position={[0, 0.38 * stoneScale, 0]}
              rotation={[Math.PI, 0, 0]}
              scale={[stoneScale, stoneScale, stoneScale]}
              castShadow
            >
              <meshPhysicalMaterial
                color={gemConfig.color}
                transmission={gemConfig.transmission}
                opacity={1}
                transparent
                roughness={gemConfig.roughness}
                ior={gemConfig.ior}
                reflectivity={0.95}
                thickness={1.6 * stoneScale}
                specularIntensity={1}
                specularColor="#f8fafc"
                dispersion={0.08}
              />
            </mesh>
          </group>

          {/* Pavé Diamond Side Accents along Band Shoulders */}
          {[-0.2, -0.32, -0.44, 0.2, 0.32, 0.44].map((radOffset, idx) => {
            const angle = Math.PI / 2 + radOffset;
            const x = Math.cos(angle) * 1.1;
            const y = Math.sin(angle) * 1.1;
            return (
              <mesh
                key={idx}
                geometry={paveGeometry}
                material={paveMaterial}
                position={[x, y, 0]}
              />
            );
          })}
        </group>
      )}

      {modelType === 'emerald-ring' && (
        <group position={ringPosition} rotation={ringRotation}>
          {/* Flat Wide Band */}
          <mesh castShadow receiveShadow>
            <torusGeometry args={[1.15, 0.16, 24, 48]} />
            <meshPhysicalMaterial
              color={metalConfig.color}
              metalness={metalConfig.metalness}
              roughness={metalConfig.roughness}
              clearcoat={1}
            />
          </mesh>

          {/* Step Basket */}
          <group position={[0, 1.25, 0]}>
            {/* 4 Corner Heavy Prongs */}
            {[
              [-0.45 * stoneScale, 0.3 * stoneScale, -0.35 * stoneScale],
              [0.45 * stoneScale, 0.3 * stoneScale, -0.35 * stoneScale],
              [-0.45 * stoneScale, 0.3 * stoneScale, 0.35 * stoneScale],
              [0.45 * stoneScale, 0.3 * stoneScale, 0.35 * stoneScale],
            ].map(([px, py, pz], i) => (
              <mesh key={i} position={[px, py, pz]}>
                <boxGeometry args={[0.08, 0.5 * stoneScale, 0.08]} />
                <meshPhysicalMaterial
                  color={metalConfig.color}
                  metalness={metalConfig.metalness}
                  roughness={metalConfig.roughness}
                />
              </mesh>
            ))}

            {/* Emerald Center Stone with Carat scaling */}
            <mesh
              geometry={emeraldDiamondGeometry}
              position={[0, 0.35 * stoneScale, 0]}
              scale={[stoneScale, stoneScale, stoneScale]}
              castShadow
            >
              <meshPhysicalMaterial
                color={gemConfig.color}
                transmission={gemConfig.transmission}
                opacity={1}
                transparent
                roughness={gemConfig.roughness}
                ior={gemConfig.ior}
                thickness={2.0 * stoneScale}
                specularIntensity={1}
                dispersion={0.08}
              />
            </mesh>
          </group>
        </group>
      )}

      {modelType === 'solitaire-bracelet' && (
        <group position={[0, displayMode === 'box' ? -0.3 : 0, 0]} rotation={[1.1, 0.2, -0.4]}>
          {/* Oval Bangle Body */}
          <mesh castShadow receiveShadow scale={[1.4, 1.1, 1.1]}>
            <torusGeometry args={[1.3, 0.09, 32, 64]} />
            <meshPhysicalMaterial
              color={metalConfig.color}
              metalness={metalConfig.metalness}
              roughness={metalConfig.roughness}
              clearcoat={1}
            />
          </mesh>

          {/* Centerpiece Cluster */}
          <group position={[0, 1.2, 0]}>
            <mesh
              geometry={brilliantDiamondGeometry}
              scale={0.8 * stoneScale}
              rotation={[Math.PI, 0, 0]}
            >
              <meshPhysicalMaterial
                color={gemConfig.color}
                transmission={gemConfig.transmission}
                opacity={1}
                transparent
                roughness={gemConfig.roughness}
                ior={gemConfig.ior}
                thickness={1.2}
              />
            </mesh>
          </group>

          {/* Clasp & Pavé Track */}
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = 0.2 + (i - 7) * 0.09;
            const x = Math.sin(angle) * 1.8;
            const y = Math.cos(angle) * 1.2;
            return (
              <mesh
                key={i}
                geometry={paveGeometry}
                material={paveMaterial}
                position={[x, y, 0]}
                scale={0.8}
              />
            );
          })}
        </group>
      )}

      {/* Presentation: Either Velvet Presentation Box OR Nero Marquina Basalt Pedestal */}
      {displayMode === 'box' ? (
        <LuxuryBox isOpen={isBoxOpen} />
      ) : (
        <group position={[0, -1.35, 0]}>
          {/* White Statuario Carrera Marble Pedestal */}
          <mesh receiveShadow>
            <cylinderGeometry args={[2.3, 2.7, 0.45, 12]} />
            <meshStandardMaterial
              color="#FAF8F5"
              roughness={0.25}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[2.7, 3.1, 0.35, 12]} />
            <meshStandardMaterial
              color="#EDE8DF"
              roughness={0.35}
              metalness={0.08}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
