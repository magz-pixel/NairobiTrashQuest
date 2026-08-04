import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function Building({
  position,
  size,
  color = '#1a3d4a',
}: {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.15} />
    </mesh>
  )
}

function KiccTower() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 3.2, 20]} />
        <meshStandardMaterial color="#234a58" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.5]} />
        <meshStandardMaterial color="#2a5564" />
      </mesh>
      <mesh position={[0, 3.75, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[0, 3.9, 0]} color="#ffb020" intensity={0.4} distance={4} />
    </group>
  )
}

function RadarCone({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (reduce || !ref.current) return
    ref.current.rotation.y += dt * 0.45
  })
  return (
    <mesh ref={ref} position={[0.2, 0.05, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[4.2, 48, 0, Math.PI * 0.28]} />
      <meshBasicMaterial
        color="#00f2fe"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function CityScene({ reduce }: { reduce: boolean }) {
  const buildings = useMemo(
    () => (
      <>
        <Building position={[-4.2, 0.7, 0.4]} size={[0.7, 1.4, 0.7]} />
        <Building position={[-3.3, 0.95, 0.2]} size={[0.55, 1.9, 0.55]} color="#1e4554" />
        <Building position={[-2.5, 0.6, 0.5]} size={[0.8, 1.2, 0.7]} />
        <Building position={[-1.4, 1.3, -0.1]} size={[0.9, 2.6, 0.55]} color="#1c404f" />
        <Building position={[1.5, 1.45, 0]} size={[0.7, 2.9, 0.7]} color="#255060" />
        <Building position={[2.35, 1.55, 0.1]} size={[0.7, 3.1, 0.7]} color="#255060" />
        <Building position={[3.4, 1.1, 0.2]} size={[0.6, 2.2, 0.6]} />
        <Building position={[4.2, 0.85, 0.4]} size={[0.9, 1.7, 0.7]} color="#1a3d4a" />
        <Building position={[5.1, 0.7, 0]} size={[0.55, 1.4, 0.55]} />
        <Building position={[-0.7, 0.9, 0.6]} size={[0.65, 1.8, 0.65]} />
        <Building position={[0.8, 0.75, 0.5]} size={[0.5, 1.5, 0.5]} />
      </>
    ),
    [],
  )

  return (
    <>
      <color attach="background" args={['#0a192f']} />
      <fog attach="fog" args={['#0a192f', 8, 22]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 2]} intensity={0.55} color="#ffb070" />
      <directionalLight position={[-3, 4, -2]} intensity={0.25} color="#00f2fe" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 16]} />
        <meshStandardMaterial color="#071613" roughness={1} />
      </mesh>
      <mesh position={[0, 0.15, -3.5]} rotation={[-Math.PI / 2.2, 0, 0]}>
        <planeGeometry args={[28, 6]} />
        <meshStandardMaterial color="#0c1f2a" roughness={1} />
      </mesh>
      {buildings}
      <KiccTower />
      <RadarCone reduce={reduce} />
      <mesh position={[0, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshBasicMaterial color="#ff6b00" transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </>
  )
}

/** Lazy-loaded WebGL canvas (pulled only when desktop + fine pointer). */
export function NightSkylineCanvas({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0.4, 2.8, 9.5], fov: 38, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <CityScene reduce={reduce} />
      </Canvas>
    </div>
  )
}
