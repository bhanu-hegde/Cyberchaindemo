import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, RoundedBox, Edges, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FlowPhase } from '../core/flowEngine';

const phaseUi = {
  [FlowPhase.BASELINE]: {
    summary: 'Centralized transaction path is active. Monitor for potential mutation points.',
    colorPrimary: '#00f0ff', // cyan
    colorSecondary: '#005f73',
  },
  [FlowPhase.ATTACK_ACTIVE]: {
    summary: 'Threat is propagating through the chain and integrity is being challenged.',
    colorPrimary: '#ff003c', // neon red
    colorSecondary: '#800000',
  },
  [FlowPhase.ATTACK_BLOCKED]: {
    summary: 'Attack attempt is visible, but blockchain validation blocked unauthorized mutation.',
    colorPrimary: '#34d399', // emerald
    colorSecondary: '#047857',
  },
  [FlowPhase.RECOVERY_IN_PROGRESS]: {
    summary: 'Consensus recovery is rebuilding canonical linkage and finalizing trusted values.',
    colorPrimary: '#34d399', 
    colorSecondary: '#059669',
  },
  [FlowPhase.SECURED]: {
    summary: 'Blockchain-secured settlement is active and chain integrity is stable.',
    colorPrimary: '#34d399', 
    colorSecondary: '#047857',
  },
};

const getToneColor = (tone) => {
  if (tone === 'danger') return '#ff003c'; // tampered (red)
  if (tone === 'warning') return '#ffaa00'; // warning (yellow)
  if (tone === 'secure') return '#00ffaa'; // secure (greenish)
  return '#00f0ff'; // normal (cyan)
}

const MULTI_COORD = [
  [0, 0, 0],   // 0
  [1, 1.2, -1],  // 1
  [2, -1.2, 1],  // 2
  [3, 0, -1.5],   // 3
  [4, 1.5, 1],   // 4
  [5, -1.2, -1],  // 5
  [6, 0.5, 1.5], // 6
  [7, -1, -0.5], // 7
];

function BlockNode({ position, block, nodeTone, isCompromised, isHealing, onClick }) {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  
  // If healing, pulse intense green, else normal tone
  const baseColor = isHealing ? '#34d399' : getToneColor(nodeTone);

  useFrame((state) => {
    if (meshRef.current) {
      if (isHealing) {
        // Intensive positive pulsing for healing states
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 8) * 0.1;
        meshRef.current.rotation.y = state.clock.elapsedTime * 2; // Fast spin
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 10) * 0.1);
      } else if (isCompromised) {
        // Red erratic alert
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 15) * 0.05;
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.05;
        meshRef.current.scale.setScalar(1);
      } else {
        // Stable
        meshRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.1);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group 
      position={position} 
      ref={meshRef}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); if(onClick) onClick(block); }}
    >
      <Float speed={isCompromised || isHealing ? 5 : 2} rotationIntensity={isCompromised || isHealing ? 1 : 0.5} floatIntensity={isCompromised || isHealing ? 2 : 1}>
        <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.15} smoothness={4}>
          <meshPhysicalMaterial 
            color="#050816" 
            emissive={baseColor} 
            emissiveIntensity={isHealing ? 2.0 : (hovered ? 0.8 : 0.3)} 
            transmission={0.9} 
            opacity={1} 
            metalness={0.8}
            roughness={0.2}
            clearcoat={1}
            ior={1.5}
            transparent
          />
          <Edges scale={1} threshold={15} color={baseColor} />
        </RoundedBox>
        
        {/* Inner Core */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={baseColor} toneMapped={false} />
        </mesh>

        <Text
          position={[0, -1.2, 0]}
          fontSize={0.25}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          {block.label}
        </Text>
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.18}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          {block.hash.substring(0, 10)}...
        </Text>
        
        {hovered && (
          <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/20 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <p className="font-bold text-sky-400 mb-1">Click for Analysis</p>
              <p><span className="text-slate-400">ID:</span> {block.transactionId}</p>
              <p><span className="text-slate-400">Previous:</span> {block.previousHash.substring(0,8)}...</p>
            </div>
          </Html>
        )}
      </Float>
    </group>
  );
}

function BlockLink({ start, end, nodeTone, isCompromised, isHealing }) {
  const linkColor = isHealing ? '#34d399' : getToneColor(nodeTone);

  const midPoint = new THREE.Vector3().addVectors(new THREE.Vector3(...start), new THREE.Vector3(...end)).multiplyScalar(0.5);
  const distance = new THREE.Vector3(...start).distanceTo(new THREE.Vector3(...end));
  const axis = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start)).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, v);

  return (
    <group position={midPoint} quaternion={quaternion}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, distance - 1.5, 8]} />
        <meshBasicMaterial color={linkColor} toneMapped={false} transparent opacity={isHealing ? 1 : (isCompromised ? 0.3 : 0.8)} />
      </mesh>
    </group>
  );
}

function ChainLights({ phaseConfig }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color={phaseConfig?.colorPrimary} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={2} color={phaseConfig?.colorSecondary} />
    </>
  );
}

function SceneContents({ blocks, chainValid, phase, recoveryStatus, onBlockClick }) {
  const targetX = -((Math.min(blocks.length, 8) - 1) * 3.5) / 2;
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 5 * delta);
    }
  });

  let firstInvalidIndex = -1;
  for(let i = 0; i < blocks.length; i++) {
     const b = blocks[i];
     if (b.edited || b.threatSignal || (i > 0 && b.previousHash !== blocks[i-1].hash)) {
         firstInvalidIndex = i;
         break;
     }
  }

  const isResolving = recoveryStatus === 'in_progress' || phase === FlowPhase.RECOVERY_IN_PROGRESS;

  return (
    <group ref={groupRef} position={[targetX, 0, 0]}>
      {blocks.slice(0, 8).map((block, index, list) => {
        let nodeTone = phase === FlowPhase.SECURED ? 'secure' : 'normal';
        let isCompromised = false;
        let isHealing = false;
        
        if (firstInvalidIndex !== -1) {
          if (index === firstInvalidIndex) {
            nodeTone = 'danger';
            isCompromised = true;
          } else if (index > firstInvalidIndex) {
            nodeTone = 'warning';
            isCompromised = true;
          }
        }

        // If a recovery solution is being processed, visually override the compromised red block with intense healing matrix
        if (isCompromised && isResolving) {
          isHealing = true;
        }

        const coord = MULTI_COORD[index % MULTI_COORD.length];
        const position = [coord[0] * 3.5, coord[1], coord[2]];

        let nextPosition = null;
        if (index < list.length - 1) {
            const nextCoord = MULTI_COORD[(index + 1) % MULTI_COORD.length];
            nextPosition = [nextCoord[0] * 3.5, nextCoord[1], nextCoord[2]];
        }

        return (
          <group key={block.id}>
            <BlockNode position={position} block={block} nodeTone={nodeTone} isCompromised={isCompromised} isHealing={isHealing} onClick={onBlockClick} />
            {nextPosition && (
              <BlockLink 
                start={position} 
                end={nextPosition} 
                nodeTone={index >= firstInvalidIndex && firstInvalidIndex !== -1 ? 'warning' : nodeTone} 
                isCompromised={isCompromised}
                isHealing={isHealing}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function Chain3DScene({ blocks, chainValid, attackState, systemMode, flowModel, recoveryStatus, onBlockClick }) {
  if (!blocks.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-10 text-center text-slate-400">
        No chain blocks are available yet.
      </div>
    );
  }

  const fallbackPhase =
    attackState.level === 'critical'
      ? FlowPhase.ATTACK_ACTIVE
      : attackState.level === 'warning'
      ? FlowPhase.ATTACK_BLOCKED
      : systemMode === 'blockchain'
      ? FlowPhase.SECURED
      : FlowPhase.BASELINE;

  const phase = flowModel?.phase ?? fallbackPhase;
  const phaseConfig = phaseUi[phase] ?? phaseUi[FlowPhase.BASELINE];

  return (
    <div className="rounded-3xl border border-white/10 bg-[#02040a] p-5 flex flex-col h-[600px] overflow-hidden shadow-[inset_0_0_50px_rgba(0,240,255,0.05)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 relative pointer-events-none">
        <div>
          <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-400 font-bold">3D Multi-Branch Chain Topology</p>
          <p className="mt-1 text-sm text-slate-300">{flowModel?.phaseDescription ?? phaseConfig.summary}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.26em] shadow-lg ${
            chainValid ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold'
          }`}
        >
          {chainValid ? 'Valid Chain' : 'Compromised'}
        </span>
      </div>

      <div className="flex-1 w-full relative -mt-16">
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 4, 18], fov: 45 }} gl={{ antialias: false }}>
            <color attach="background" args={['#02040a']} />
            <fog attach="fog" args={['#02040a', 15, 35]} />
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            
            <ChainLights phaseConfig={phaseConfig} />
            <OrbitControls enableZoom={true} enablePan={true} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 6} />
            
            <SceneContents blocks={blocks} chainValid={chainValid} phase={phase} recoveryStatus={recoveryStatus} onBlockClick={onBlockClick} />

            <EffectComposer disableNormalPass multisampling={4}>
              <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2.0} />
              <Noise opacity={0.04} />
            </EffectComposer>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
