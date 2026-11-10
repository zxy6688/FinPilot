import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  SRGBColorSpace,
  ACESFilmicToneMapping,
  OrthographicCamera,
  Mesh,
  Group,
  SphereGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Vector3,
  Quaternion,
  type AnimationAction,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { loops, type PetAction } from "./PetDirector";
import PetRoom3D from "./PetRoom3D";
import type { LifeData } from "./PetLife";
type Props = {
  action: PetAction;
  sequence: number;
  reduced: boolean;
  paused?: boolean;
  angle?: number;
  studio?: boolean;
  room?: LifeData["room"];
  outfit?: LifeData["outfit"];
  onPlay?: () => void;
  toyCommand?:{kind:string;id:number};
  contact?: { x: number; y: number };
  expression?:
    "Happy" | "Confused" | "Drowsy" | "Surprise" | "Shy" | "Sad" | "Relaxed";
  onFinish: (sequence: number) => void;
  onReady?: () => void;
  onFailure?: () => void;
};
function Fit() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (camera instanceof OrthographicCamera) {
      camera.zoom = Math.min(size.height / 3.1, size.width / 2.5);
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size, invalidate]);
  return null;
}
function FinModel({
  action,
  sequence,
  reduced,
  paused,
  angle = 0,
  onFinish,
  onReady,
  onFailure,
  contact,
  expression,
  outfit,
}: Props) {
  const gltf = useLoader(GLTFLoader, "/fin-3d/fin-full.glb");
  const scene = useMemo(() => {
    const s = clone(gltf.scene);
    s.traverse((o) => {
      o.castShadow = true;
      // Thin leaf surfaces must not self-shadow into dotted acne at pet scale.
      o.receiveShadow = false;
    });
    return s;
  }, [gltf]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  useEffect(() => {
    const attached: Group[] = [];
    const materials: MeshStandardMaterial[] = [];
    const geometries: (SphereGeometry | TorusGeometry)[] = [];
    const part = (
      bone: string,
      color: string,
      geometry: SphereGeometry | TorusGeometry,
      position: [number, number, number],
      scale: [number, number, number],
    ) => {
      const parent = scene.getObjectByName(bone);
      if (!parent) return;
      scene.updateMatrixWorld(true);
      const material = new MeshStandardMaterial({ color, roughness: 0.9 });
      const group = new Group();
      const mesh = new Mesh(geometry, material);
      group.position.copy(parent.worldToLocal(new Vector3(...position)));
      group.quaternion.copy(
        parent.getWorldQuaternion(new Quaternion()).invert(),
      );
      mesh.scale.set(...scale);
      if (geometry instanceof TorusGeometry) mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
      parent.add(group);
      attached.push(group);
      materials.push(material);
      geometries.push(geometry);
    };
    if (outfit?.hat)
      part(
        "Head",
        "#d6aa72",
        new SphereGeometry(0.38, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        [-0.3, 2.13, -0.05],
        [1, 0.45, 0.9],
      );
    if (outfit?.scarf)
      part(
        "Body",
        "#bc8071",
        new TorusGeometry(0.29, 0.055, 12, 36),
        [0, 0.98, 0],
        [1, 1, 1],
      );
    return () => {
      attached.forEach((g) => g.removeFromParent());
      materials.forEach((m) => m.dispose());
      geometries.forEach((g) => g.dispose());
    };
  }, [scene, outfit?.hat, outfit?.scarf]);
  const previous = useRef<AnimationAction | null>(null),
    tick = useRef(0),
    slow = useRef(0);
  const fading = useRef<AnimationAction | null>(null);
  const blendTime = useRef(0);
  const performanceSamples = useRef<number[]>([]);
  const previousContact = useRef({ x: 0, y: 0 });
  const { invalidate, gl } = useThree();
  const gaze = useRef({ x: 0, y: 0 }),
    smoothGaze = useRef({ x: 0, y: 0 });
  const eyes = useMemo(() => {
    const found: typeof scene.children = [];
    scene.traverse((o) => {
      if (/^Gaze[._]?[LR]$/.test(o.name)) found.push(o);
    });
    return found.map((node) => ({ node, rest: node.position.clone() }));
  }, [scene]);
  useEffect(() => {
    if (paused || reduced) return;
    const point = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      gaze.current = {
        x: Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 300)),
        y: Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / 300)),
      };
    };
    window.addEventListener("pointermove", point, { passive: true });
    return () => window.removeEventListener("pointermove", point);
  }, [gl, paused, reduced]);
  useEffect(() => {
    onReady?.();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [mixer, scene]);
  useEffect(() => {
    const clip = gltf.animations.find((c) => c.name === action);
    if (!clip) return;
    const next = mixer.clipAction(clip);
    // Retire the older fade before starting another transition: never accumulate poses.
    if (fading.current && fading.current !== previous.current)
      fading.current.stop();
    fading.current = null;
    next
      .reset()
      .setLoop(
        loops.has(action) ? LoopRepeat : LoopOnce,
        loops.has(action) ? Infinity : 1,
      );
    next.clampWhenFinished = true;
    next.enabled = true;
    next.play();
    if (previous.current && previous.current !== next) {
      previous.current.fadeOut(reduced ? 0 : 0.28);
      next.fadeIn(reduced ? 0 : 0.28);
      fading.current = previous.current;
      blendTime.current = 0;
    }
    previous.current = next;
    if (reduced) {
      next.time = action === "Sleep" ? 0 : action === "Sit" ? clip.duration : 0;
      mixer.update(0);
      invalidate();
    }
    const done = (e: { action: AnimationAction }) => {
      if (e.action === next) onFinish(sequence);
    };
    mixer.addEventListener("finished", done);
    invalidate();
    return () => mixer.removeEventListener("finished", done);
  }, [action, sequence, reduced, gltf, mixer]);
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(
      invalidate,
      1000 / (loops.has(action) ? 24 : innerWidth < 700 ? 30 : 60),
    );
    return () => clearInterval(timer);
  }, [paused, reduced, action, invalidate]);
  useEffect(() => invalidate(), [angle, invalidate]);
  useFrame((_, dt) => {
    const started = performance.now();
    if (!paused && !reduced) {
      slow.current =
        dt > 0.12 && dt < 1
          ? slow.current + dt
          : Math.max(0, slow.current - 0.1);
      if (slow.current > 5) {
        onFailure?.();
        slow.current = 0;
      }
      const head = scene.getObjectByName("Head");
      if (head) {
        head.rotation.x -= previousContact.current.y;
        head.rotation.y -= previousContact.current.x;
      }
      previousContact.current = { x: 0, y: 0 };
      mixer.update(Math.min(dt, 0.08));
      blendTime.current += dt;
      if (fading.current && blendTime.current >= 0.3) {
        fading.current.stop();
        fading.current = null;
      }
      tick.current++;
      // Mixer skips writing unchanged properties. Never add offsets to last frame.
      for (const eye of eyes) eye.node.position.copy(eye.rest);
      if (action === "Idle") {
        smoothGaze.current.x += (gaze.current.x - smoothGaze.current.x) * 0.08;
        smoothGaze.current.y += (gaze.current.y - smoothGaze.current.y) * 0.08;
        for (const eye of eyes) {
          eye.node.position.x = eye.rest.x + smoothGaze.current.x * 0.017;
          eye.node.position.z = eye.rest.z - smoothGaze.current.y * 0.012;
        }
      }
      if (action === "Pet" && contact) {
        const head = scene.getObjectByName("Head");
        const a = previous.current;
        const envelope = a
          ? Math.sin(Math.PI * Math.min(1, a.time / a.getClip().duration))
          : 0;
        if (head) {
          previousContact.current = {
            x: contact.x * 0.13 * envelope,
            y: contact.y * 0.06 * envelope,
          };
          head.rotation.y += previousContact.current.x;
          head.rotation.x += previousContact.current.y;
        }
      }
    }
    if (expression)
      scene.traverse((o) => {
        if (
          o instanceof Mesh &&
          o.morphTargetDictionary &&
          o.morphTargetInfluences
        ) {
          const index = o.morphTargetDictionary[expression];
          if (index !== undefined) o.morphTargetInfluences[index] = 1;
        }
      });
    const samples = performanceSamples.current;
    samples.push(performance.now() - started);
    if (samples.length > 180) samples.shift();
    if (tick.current % 12 === 0) {
      const sorted = [...samples].sort((a, b) => a - b);
      gl.domElement.dataset.updateP95 = String(
        sorted[Math.floor(sorted.length * 0.95)] || 0,
      );
      gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
      gl.domElement.dataset.triangles = String(gl.info.render.triangles);
      gl.domElement.dataset.geometries = String(gl.info.memory.geometries);
      gl.domElement.dataset.activeClips = String(fading.current ? 2 : 1);
    }
    gl.domElement.dataset.frames = String(tick.current);
    gl.domElement.dataset.gazeOffset = String(
      Math.max(0, ...eyes.map((eye) => eye.node.position.distanceTo(eye.rest))),
    );
  });
  return (
    <group rotation={[0, angle, 0]}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
export default function FinScene(props: Props) {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, props.studio ? 1.5 : 1]}
      shadows={!!props.studio}
      orthographic
      camera={{
        position: [0, 1.6, 6],
        zoom: props.studio ? 140 : 48,
        near: 0.1,
        far: 30,
      }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 1.5, 0);
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        const lost = (e: Event) => {
          if(!gl.domElement.isConnected)return;
          e.preventDefault();
          props.onFailure?.();
        };
        gl.domElement.addEventListener("webglcontextlost", lost, {
          once: true,
        });
      }}
    >
      <Fit />
      {props.room && (
        <PetRoom3D
          room={props.room}
          reduced={props.reduced}
          onPlay={props.onPlay}
          command={props.toyCommand}
        />
      )}
      <hemisphereLight args={["#fff8e6", "#78968b", 2]} />
      <directionalLight
        position={[-3, 5, 4]}
        intensity={3}
        castShadow={props.studio}
        shadow-mapSize={[1024, 1024]}
        shadow-normalBias={0.035}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-2}
      />
      <directionalLight position={[3, 2, -2]} intensity={2} color="#c3ead8" />
      <Suspense fallback={null}>
        <FinModel {...props} paused={props.paused || !visible} />
      </Suspense>
      {props.studio && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.015, 0]}
          receiveShadow
        >
          <circleGeometry args={[1.6, 64]} />
          <meshStandardMaterial color="#dce9d5" roughness={1} />
        </mesh>
      )}
    </Canvas>
  );
}
