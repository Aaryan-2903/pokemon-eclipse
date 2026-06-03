import { Suspense, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Group, Mesh, MeshBasicMaterial, PointLight } from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows, Environment, Float, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

type PointerState = {
  x: number;
  y: number;
};

function CinematicLights() {
  const keyLight = useRef<PointLight | null>(null);
  const rimLight = useRef<PointLight | null>(null);
  const glintLight = useRef<PointLight | null>(null);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

    if (keyLight.current) {
      keyLight.current.intensity = 1.86 + Math.sin(time * 1.2) * 0.16;
      keyLight.current.position.x = 2.8 + Math.sin(time * 0.55) * 0.32;
    }

    if (rimLight.current) {
      rimLight.current.intensity = 0.82 + Math.sin(time * 0.85) * 0.12;
    }

    if (glintLight.current) {
      glintLight.current.intensity = 0.42 + Math.max(0, Math.sin(time * 0.72)) * 0.28;
      glintLight.current.position.x = Math.sin(time * 0.38) * 2.8;
      glintLight.current.position.y = 1.35 + Math.cos(time * 0.42) * 0.55;
    }
  });

  return (
    <>
      <ambientLight intensity={0.16} />
      <directionalLight
        castShadow
        position={[5.5, 6, 7]}
        intensity={1.08}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <pointLight ref={keyLight} position={[2.8, 1.7, 3.4]} intensity={1.86} color="#ffe9df" />
      <pointLight ref={rimLight} position={[-3.4, -2.2, -1.7]} intensity={0.82} color="#6681ff" />
      <pointLight ref={glintLight} position={[0, 1.35, 2.7]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 2.6, -3.2]} intensity={0.44} color="#ff2f45" />
    </>
  );
}

function CameraRig({ pointer }: { pointer: MutableRefObject<PointerState> }) {
  useFrame(({ camera }) => {
    camera.position.x += (pointer.current.x * 0.52 - camera.position.x) * 0.045;
    camera.position.y += (-pointer.current.y * 0.32 - camera.position.y) * 0.045;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function PokeballMesh({ pointer }: { pointer: MutableRefObject<PointerState> }) {
  const group = useRef<Group | null>(null);
  const glow = useRef<Mesh | null>(null);

  useFrame(({ clock }) => {
    if (group.current) {
      const t = clock.elapsedTime;
      const pulse = Math.pow(Math.max(0, Math.sin(t * 0.72 - 0.7)), 12);
      const xTarget = pointer.current.y * 0.13 + Math.sin(t * 0.33) * 0.045;
      const yTarget = pointer.current.x * 0.2 + Math.sin(t * 0.24) * 0.16;
      group.current.rotation.x += (xTarget - group.current.rotation.x) * 0.08;
      group.current.rotation.y += (yTarget - group.current.rotation.y) * 0.065;
      group.current.position.x += (pointer.current.x * 0.2 - group.current.position.x) * 0.08;
      group.current.position.y += (Math.sin(t * 0.88) * 0.11 - pointer.current.y * 0.09 - group.current.position.y) * 0.075;
      group.current.rotation.z = Math.sin(t * 0.48) * 0.045;

      if (glow.current) {
        const glowMaterial = glow.current.material as MeshBasicMaterial;
        glow.current.scale.setScalar(1.03 + pulse * 0.12 + Math.sin(t * 1.05) * 0.012);
        glowMaterial.opacity = 0.08 + pulse * 0.2;
      }
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.35} rotationIntensity={0.24} floatIntensity={0.32}>
        <group>
          <mesh ref={glow}>
            <sphereGeometry args={[1.46, 64, 32]} />
            <meshBasicMaterial color="#ff3348" transparent opacity={0.08} depthWrite={false} />
          </mesh>

          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1.36, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial
              color="#eb1f2f"
              roughness={0.12}
              metalness={0.46}
              clearcoat={1}
              clearcoatRoughness={0.055}
              envMapIntensity={2.15}
            />
          </mesh>

          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1.36, 96, 48, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshPhysicalMaterial
              color="#f4f7fb"
              roughness={0.1}
              metalness={0.28}
              clearcoat={1}
              clearcoatRoughness={0.08}
              envMapIntensity={2.05}
            />
          </mesh>

          <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.36, 0.075, 18, 128]} />
            <meshPhysicalMaterial color="#07080d" metalness={0.95} roughness={0.13} envMapIntensity={2} />
          </mesh>

          <mesh castShadow receiveShadow position={[0, 0, 1.31]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.13, 72]} />
            <meshPhysicalMaterial color="#05060a" metalness={0.98} roughness={0.12} envMapIntensity={2.1} />
          </mesh>

          <mesh castShadow receiveShadow position={[0, 0, 1.39]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.09, 64]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.6} roughness={0.035} clearcoat={1} envMapIntensity={2.6} />
          </mesh>

          <mesh position={[-0.42, 0.54, 1.14]} rotation={[0.24, -0.34, 0.08]}>
            <circleGeometry args={[0.22, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.23} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function LivingStarfield() {
  const stars = useRef<Group | null>(null);

  useFrame(({ clock }) => {
    if (stars.current) {
      const time = clock.elapsedTime;
      stars.current.rotation.y = time * 0.012;
      stars.current.rotation.x = Math.sin(time * 0.08) * 0.035;
    }
  });

  return (
    <group ref={stars}>
      <Stars radius={34} depth={56} count={2300} factor={5.6} saturation={0} fade speed={0.18} />
      <Stars radius={16} depth={24} count={420} factor={2.5} saturation={0.3} fade speed={0.35} />
      <Sparkles count={82} opacity={0.5} scale={10.5} size={1.05} speed={0.26} color="#fef3f3" />
      <Sparkles count={24} opacity={0.28} scale={5.8} size={1.6} speed={0.18} color="#8fa8ff" />
    </group>
  );
}

function PokeBallScene() {
  const pointer = useRef<PointerState>({ x: 0, y: 0 });

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_42%,_rgba(255,255,255,0.09),transparent_33%),radial-gradient(circle_at_50%_68%,_rgba(243,36,36,0.14),transparent_32%),linear-gradient(180deg,#020712_0%,#07101d_58%,#030509_100%)] shadow-[0_0_140px_rgba(243,36,36,0.18)]"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        pointer.current = { x, y };
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-75">
        <div className="absolute left-10 top-14 h-24 w-24 rounded-full bg-poke/15 blur-3xl animate-float" />
        <div className="absolute right-16 top-24 h-32 w-32 rounded-full bg-blue-400/12 blur-3xl animate-float-slow" />
        <div className="absolute left-1/2 top-6 h-20 w-20 -translate-x-1/2 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),transparent_18%)]" />
      </div>

      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 0, 6.15], fov: 35 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#050c16']} />
        <Suspense fallback={null}>
          <Environment preset="city" background={false} environmentIntensity={1.35} />
          <CinematicLights />
          <LivingStarfield />
          <ContactShadows position={[0, -1.38, 0]} opacity={0.48} scale={5} blur={2.3} far={1.8} />
          <PokeballMesh pointer={pointer} />
          <CameraRig pointer={pointer} />
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.22} luminanceSmoothing={0.82} intensity={0.48} height={260} />
        </EffectComposer>
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}

export default PokeBallScene;
