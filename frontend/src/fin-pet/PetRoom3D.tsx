import { useRef, useState,useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { LifeData } from "./PetLife";
export default function PetRoom3D({
  room,
  reduced,
  onPlay,
  command,
}: {
  room: LifeData["room"];
  reduced: boolean;
  onPlay?: () => void;
  command?:{kind:string;id:number};
}) {
  const ball = useRef<Group>(null),
    plane = useRef<Group>(null),
    [play, setPlay] = useState<{ kind: string; at: number } | null>(null);
  useFrame(() => {
    if (!play || reduced) return;
    const t = (performance.now() - play.at) / 1000;
    if (t > 4) {
      setPlay(null);
      return;
    }
    if (play.kind === "ball" && ball.current) {
      ball.current.position.x =
        0.8 + Math.sin(t * 4) * 0.35 * Math.exp(-t * 0.5);
      ball.current.position.y =
        0.14 + Math.abs(Math.sin(t * 6)) * 0.35 * Math.exp(-t * 0.6);
    }
    if (play.kind === "plane" && plane.current) {
      plane.current.position.set(
        Math.sin(t * 2) * 0.9,
        1 + Math.sin((t * Math.PI) / 4) * 0.7,
        -0.4,
      );
      plane.current.rotation.z = Math.cos(t * 2) * 0.2;
    }
  });
  const toy = (kind: string) => {
    setPlay({ kind, at: performance.now() });
    onPlay?.();
  };
  useEffect(()=>{if(command)setPlay({kind:command.kind,at:performance.now()})},[command]);
  return (
    <group>
      <mesh position={[0, 1.4, -0.85]}>
        <boxGeometry args={[3.6, 2.8, 0.06]} />
        <meshStandardMaterial color="#f3edda" roughness={1} />
      </mesh>
      <mesh position={[0.8, 1.9, -0.79]}>
        <boxGeometry args={[1.1, 1.2, 0.05]} />
        <meshStandardMaterial
          color={
            room.window === "night"
              ? "#304f64"
              : room.window === "rain"
                ? "#9bb9c2"
                : "#b9d9b8"
          }
          roughness={1}
        />
      </mesh>
      <mesh position={[0.8, 1.9, -0.74]}>
        <boxGeometry args={[0.035, 1.25, 0.06]} />
        <meshStandardMaterial color="#f6f0dc" />
      </mesh>
      <mesh position={[0.8, 1.9, -0.73]}>
        <boxGeometry args={[1.15, 0.035, 0.06]} />
        <meshStandardMaterial color="#f6f0dc" />
      </mesh>
      <mesh position={[1.12, 2.24, -0.75]}>
        <circleGeometry args={[0.105, 24]} />
        <meshStandardMaterial
          color={room.window === "night" ? "#f3e7b0" : "#f6d98e"}
          emissive="#d6ba6b"
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[3.6, 0.1, 2]} />
        <meshStandardMaterial color="#ddd0b4" roughness={1} />
      </mesh>
      {[
        [-0.8, 0],
        [0.8, 0],
      ].map(([x], i) => (
        <mesh key={i} position={[x, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.8, 48]} />
          <meshStandardMaterial color="#dce9cf" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.035, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 48]} />
        <meshStandardMaterial
          color={room.cushion === "mint" ? "#9ac7b4" : "#eee2bc"}
          roughness={1}
        />
      </mesh>
      {room.bed && (
        <group position={[-1, 0.14, -0.35]}>
          <mesh>
            <boxGeometry args={[0.65, 0.22, 0.9]} />
            <meshStandardMaterial color="#b99b72" roughness={1} />
          </mesh>
          <mesh position={[0, 0.15, 0]} scale={[1, 0.4, 1.4]}>
            <sphereGeometry args={[0.31, 24, 16]} />
            <meshStandardMaterial color="#e7dbc0" roughness={1} />
          </mesh>
        </group>
      )}
      {room.lamp && (
        <group position={[-1.25, 0.5, -0.6]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.035, 0.8, 12]} />
            <meshStandardMaterial color="#998057" />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.23, 0.27, 24, 1, true]} />
            <meshStandardMaterial color="#f1dc9e" side={2} />
          </mesh>
          <pointLight
            position={[0, 0.3, 0.1]}
            intensity={0.8}
            color="#ffdda2"
            distance={3}
          />
        </group>
      )}
      <group ref={ball} position={[0.8, 0.14, 0.4]} onClick={() => toy("ball")}>
        <mesh>
          <sphereGeometry args={[0.14, 24, 16]} />
          <meshStandardMaterial color="#d8aa68" roughness={0.8} />
        </mesh>
      </group>
      <group
        ref={plane}
        position={[-0.8, 0.35, 0.4]}
        onClick={() => toy("plane")}
        rotation={[0, 0, 0.2]}
      >
        <mesh>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([.3,0,0,-.18,.025,.22,-.1,.045,0,.3,0,0,-.1,.045,0,-.18,.025,-.22,.3,0,0,-.1,-.07,0,-.1,.045,0]),3]}/></bufferGeometry>
          <meshStandardMaterial color="#fff9e7" roughness={0.9} side={2} />
        </mesh>
      </group>
    </group>
  );
}
