import { useFrame } from '@react-three/fiber';
import { type RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import {
  CanvasTexture,
  type Group,
  type Mesh,
  type PerspectiveCamera,
  Mesh as ThreeMesh,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { type WorldPath, chaseCamera, poseAt } from '../../domain/world/path';
import { spanRod } from './geometry';

/** What the rider is doing, updated by the race view on every tick. */
export interface RiderMotion {
  distanceM: number;
  speedMs: number;
  cadenceRpm: number | null;
  running: boolean;
  /** performance.now() of the last update, to move smoothly between ticks. */
  atMs: number;
}

const WHEEL_R = 0.34;
const CRANK_M = 0.17;
const THIGH_M = 0.46;
const SHIN_M = 0.46;
/** Rider model points (metres), bike facing -z, wheels on y = 0. */
const P = {
  rearHub: new Vector3(0, WHEEL_R, 0.5),
  frontHub: new Vector3(0, WHEEL_R, -0.52),
  bb: new Vector3(0, 0.3, 0.06),
  seat: new Vector3(0, 0.95, 0.2),
  headTop: new Vector3(0, 0.92, -0.4),
  bar: new Vector3(0, 1.0, -0.47),
  hip: new Vector3(0, 1.02, 0.17),
  shoulder: new Vector3(0, 1.42, -0.22),
  shoulderL: new Vector3(-0.19, 1.4, -0.22),
  shoulderR: new Vector3(0.19, 1.4, -0.22),
  elbowL: new Vector3(-0.22, 1.18, -0.33),
  elbowR: new Vector3(0.22, 1.18, -0.33),
  handL: new Vector3(-0.2, 1.02, -0.5),
  handR: new Vector3(0.2, 1.02, -0.5),
  barL: new Vector3(-0.22, 1.0, -0.47),
  barR: new Vector3(0.22, 1.0, -0.47),
};
const G = 9.81;
const GHOST_OFFSET_M = 1.3;
/** Wraps an angle difference to (-π, π]. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const JERSEY = '#1f5fd1';
const SHORTS = '#1d2430';
const SKIN = '#e0b48f';
const FRAME = '#c8312b';

/**
 * Knee for a hip and a pedal: a two-link leg (law of cosines), worked in the
 * (forward, up) plane with forward = -z, choosing the bend that puts the knee in front.
 */
function knee(hip: Vector3, foot: Vector3, out: Vector3): Vector3 {
  const du = -(foot.z - hip.z);
  const dv = foot.y - hip.y;
  const dist = Math.max(0.05, Math.min(THIGH_M + SHIN_M - 0.001, Math.hypot(du, dv)));
  const cos = (THIGH_M ** 2 + dist ** 2 - SHIN_M ** 2) / (2 * THIGH_M * dist);
  const angle = Math.atan2(dv, du) + Math.acos(Math.min(1, Math.max(-1, cos)));
  return out.set(hip.x, hip.y + Math.sin(angle) * THIGH_M, hip.z - Math.cos(angle) * THIGH_M);
}

/** Colour of the ghost rider and of its marks on the profile. */
export const GHOST_COLOUR = '#22c7f0';

/** A rounded label drawn on a canvas, used as a sprite texture. */
function labelCanvasTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(8, 40, 56, 0.82)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 120, 60);
    ctx.fill();
    ctx.strokeStyle = GHOST_COLOUR;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 68, 470);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A simple cyclist that pedals with the cadence and turns its wheels with the
 * speed, and the chase camera behind it. Between race-view ticks it keeps moving
 * at the last speed, so the picture is smooth.
 */
export default function WorldRider({
  path,
  motion,
  ghost = false,
  label,
}: {
  path: WorldPath;
  motion: RefObject<RiderMotion>;
  /** A translucent rival a little to the left that does not drive the camera. */
  ghost?: boolean;
  /** Text floating over the rider (the ghost: "Tú · 22 nov"). */
  label?: string;
}) {
  const labelTexture = useMemo(() => (label ? labelCanvasTexture(label) : null), [label]);
  const bike = useRef<Group>(null);
  const crank = useRef<Group>(null);
  // Moving parts, filled in by callback refs: wheels [rear, front], legs [thigh, shin] × 2.
  const parts = useRef<{
    wheels: (Group | null)[];
    legs: (Mesh | null)[];
    feet: (Mesh | null)[];
  }>({ wheels: [], legs: [], feet: [] });
  const staticRods = useMemo(
    () =>
      [
        [P.rearHub, P.bb, 0.022, FRAME],
        [P.rearHub, P.seat, 0.02, FRAME],
        [P.bb, P.seat, 0.026, FRAME],
        [P.bb, P.headTop, 0.03, FRAME],
        [P.seat, P.headTop, 0.026, FRAME],
        [P.headTop, P.frontHub, 0.022, '#333'],
        [P.headTop, P.bar, 0.02, '#333'],
        [P.hip, P.shoulder, 0.17, JERSEY],
        [P.shoulderL, P.shoulderR, 0.09, JERSEY],
        [P.barL, P.barR, 0.016, '#222'],
        [P.shoulderL, P.elbowL, 0.05, JERSEY],
        [P.shoulderR, P.elbowR, 0.05, JERSEY],
        [P.elbowL, P.handL, 0.04, SKIN],
        [P.elbowR, P.handR, 0.04, SKIN],
      ] as const,
    [],
  );
  // Every part of the rider and bike casts a shadow on the road.
  useLayoutEffect(() => {
    bike.current?.traverse((o) => {
      o.castShadow = !ghost;
      if (ghost && o instanceof ThreeMesh) {
        // One colour of its own, lit from inside, so it stands out from the
        // scenery and from your rider even a long way ahead.
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.transparent = true;
          m.opacity = 0.6;
          m.depthWrite = false;
          if ('color' in m) m.color.set(GHOST_COLOUR);
          if ('emissive' in m) m.emissive.set(GHOST_COLOUR).multiplyScalar(0.45);
        }
      }
    });
  }, [ghost]);
  const shown = useRef({ d: 0, crank: 0, wheel: 0, lean: 0, ready: false });
  const camPos = useRef(new Vector3());
  const camLook = useRef(new Vector3());
  const tmp = useMemo(
    () => ({
      foot: new Vector3(),
      knee: new Vector3(),
      hip: new Vector3(),
      look: new Vector3(),
      cam: new Vector3(),
    }),
    [],
  );

  useFrame(({ camera }, dtRaw) => {
    const m = motion.current;
    const dt = Math.min(0.1, dtRaw);
    const s = shown.current;
    // Where the rider should be now: last tick plus the time since, at its speed.
    const since = m.running ? Math.min(0.5, (performance.now() - m.atMs) / 1000) : 0;
    const target = m.distanceM + m.speedMs * since;
    if (!s.ready || Math.abs(target - s.d) > 50) s.d = target;
    else s.d += (target - s.d) * (1 - Math.exp(-dt * 6));

    const pose = poseAt(path, s.d);
    // Pedalling: the measured cadence, or a natural one while the bike moves.
    const moving = m.running && m.speedMs > 0.3;
    const rpm = moving ? (m.cadenceRpm ?? 80) : 0;
    s.crank += (rpm / 60) * Math.PI * 2 * dt;

    // Lean into corners as a real bike does: tan(lean) = v² / (g·R) = v · yaw rate / g.
    const turnPerM = wrap(poseAt(path, s.d + 4).heading - poseAt(path, s.d - 4).heading) / 8;
    const v = moving ? m.speedMs : 0;
    const leanTarget = Math.max(-0.4, Math.min(0.4, Math.atan((v * v * turnPerM) / G)));
    s.lean += (leanTarget - s.lean) * (1 - Math.exp(-dt * 3));
    // A little side-to-side rock with each pedal stroke.
    const rock = moving ? Math.sin(s.crank) * 0.025 : 0;
    // The ghost rides 1.3 m to the left so the two never overlap.
    const side = ghost ? -GHOST_OFFSET_M : 0;
    bike.current?.position.set(
      pose.position.x + Math.cos(pose.heading) * side,
      pose.position.y + 0.02,
      pose.position.z + Math.sin(pose.heading) * side,
    );
    bike.current?.rotation.set(pose.pitch, -pose.heading, -s.lean + rock, 'YXZ');
    s.wheel += (moving ? m.speedMs / WHEEL_R : 0) * dt;
    for (const w of parts.current.wheels) if (w) w.rotation.x = -s.wheel;
    if (crank.current) crank.current.rotation.x = -s.crank;

    // Legs: hip to knee to pedal, each side half a turn apart.
    for (let side = 0; side < 2; side++) {
      const x = side === 0 ? -0.1 : 0.1;
      const a = s.crank + side * Math.PI;
      tmp.foot.set(x, P.bb.y + Math.cos(a) * CRANK_M, P.bb.z - Math.sin(a) * CRANK_M);
      tmp.hip.set(x, P.hip.y, P.hip.z);
      knee(tmp.hip, tmp.foot, tmp.knee);
      const thigh = parts.current.legs[side * 2];
      const shin = parts.current.legs[side * 2 + 1];
      if (thigh) spanRod(thigh, tmp.hip, tmp.knee);
      if (shin) spanRod(shin, tmp.knee, tmp.foot);
      parts.current.feet[side]?.position.set(x, tmp.foot.y, tmp.foot.z - 0.05);
    }

    if (ghost) return;
    // Chase camera, eased so corners and hills feel smooth.
    const cam = chaseCamera(path, s.d);
    tmp.look.set(cam.target.x, cam.target.y, cam.target.z);
    if (!s.ready) {
      camPos.current.set(cam.position.x, cam.position.y, cam.position.z);
      camLook.current.copy(tmp.look);
      s.ready = true;
    } else {
      // The look-at point eases more slowly than the position: through a bend the
      // view swings round gently instead of snapping to the road ahead.
      const kPos = 1 - Math.exp(-dt * 2.5);
      const kLook = 1 - Math.exp(-dt * 1.8);
      camPos.current.lerp(tmp.cam.set(cam.position.x, cam.position.y, cam.position.z), kPos);
      camLook.current.lerp(tmp.look, kLook);
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
    // Bank a little with the bike, and widen the view slightly with speed.
    camera.rotateZ(-s.lean * 0.3);
    const cam3 = camera as PerspectiveCamera;
    const fov = 58 + Math.min(8, v * 0.35);
    if (Math.abs(cam3.fov - fov) > 0.05) {
      cam3.fov += (fov - cam3.fov) * (1 - Math.exp(-dt * 2));
      cam3.updateProjectionMatrix();
    }
  });

  return (
    <group ref={bike}>
      {labelTexture && (
        // On top, facing the camera and the same size on screen however far
        // ahead the ghost is (no size attenuation), so it always reads.
        <sprite position={[0, 2.3, 0]} scale={[0.14, 0.035, 1]} renderOrder={10}>
          <spriteMaterial
            map={labelTexture}
            depthTest={false}
            transparent
            sizeAttenuation={false}
          />
        </sprite>
      )}
      {[P.rearHub, P.frontHub].map((hub, i) => (
        <group
          key={i}
          ref={(el) => {
            parts.current.wheels[i] = el;
          }}
          position={hub}
        >
          {/* Tyre, rim, hub and spokes, all in the wheel's plane (y–z). */}
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[WHEEL_R - 0.016, 0.018, 8, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[WHEEL_R - 0.045, 0.012, 6, 32]} />
            <meshStandardMaterial color="#2b2b2e" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 10]} />
            <meshStandardMaterial color="#9a9a9a" metalness={0.7} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <mesh key={k} rotation={[(k * Math.PI) / 8, 0, 0]}>
              <cylinderGeometry args={[0.003, 0.003, (WHEEL_R - 0.05) * 2, 3]} />
              <meshStandardMaterial color="#c8c8c8" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Saddle */}
      <mesh position={[0, P.seat.y + 0.04, P.seat.z - 0.03]}>
        <boxGeometry args={[0.13, 0.04, 0.27]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      {/* Shoes, moved with the pedals */}
      {[0, 1].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            parts.current.feet[i] = el;
          }}
        >
          <boxGeometry args={[0.09, 0.07, 0.25]} />
          <meshStandardMaterial color="#f2f2f2" roughness={0.5} />
        </mesh>
      ))}
      {staticRods.map(([a, b, r, color], i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) spanRod(el, a, b);
          }}
        >
          <cylinderGeometry args={[r, r, 1, 8]} />
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
      <group ref={crank} position={P.bb}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 12]} />
          <meshLambertMaterial color="#888" />
        </mesh>
      </group>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            parts.current.legs[i] = el;
          }}
        >
          <cylinderGeometry args={[i % 2 ? 0.05 : 0.075, i % 2 ? 0.05 : 0.075, 1, 8]} />
          <meshLambertMaterial color={i % 2 ? SKIN : SHORTS} />
        </mesh>
      ))}
      {/* Head with helmet */}
      <mesh position={[0, 1.6, -0.36]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshLambertMaterial color={SKIN} />
      </mesh>
      <mesh position={[0, 1.66, -0.34]} scale={[1, 0.7, 1.25]}>
        <sphereGeometry args={[0.135, 12, 10]} />
        <meshLambertMaterial color="#f4f4f4" />
      </mesh>
    </group>
  );
}
