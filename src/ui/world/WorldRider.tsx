import { useFrame } from '@react-three/fiber';
import { type RefObject, useMemo, useRef } from 'react';
import { type Group, type Mesh, Vector3 } from 'three';
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
};
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

/**
 * A simple cyclist that pedals with the cadence and turns its wheels with the
 * speed, and the chase camera behind it. Between race-view ticks it keeps moving
 * at the last speed, so the picture is smooth.
 */
export default function WorldRider({
  path,
  motion,
}: {
  path: WorldPath;
  motion: RefObject<RiderMotion>;
}) {
  const bike = useRef<Group>(null);
  const crank = useRef<Group>(null);
  // Moving parts, filled in by callback refs: wheels [rear, front], legs [thigh, shin] × 2.
  const parts = useRef<{ wheels: (Mesh | null)[]; legs: (Mesh | null)[] }>({
    wheels: [],
    legs: [],
  });
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
        [P.shoulder, P.bar.clone().setY(P.bar.y + 0.02), 0.05, JERSEY],
      ] as const,
    [],
  );
  const shown = useRef({ d: 0, crank: 0, wheel: 0, ready: false });
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
    bike.current?.position.set(pose.position.x, pose.position.y + 0.02, pose.position.z);
    bike.current?.rotation.set(pose.pitch, -pose.heading, 0, 'YXZ');

    // Pedalling: the measured cadence, or a natural one while the bike moves.
    const moving = m.running && m.speedMs > 0.3;
    const rpm = moving ? (m.cadenceRpm ?? 80) : 0;
    s.crank += (rpm / 60) * Math.PI * 2 * dt;
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
    }

    // Chase camera, eased so corners and hills feel smooth.
    const cam = chaseCamera(path, s.d);
    tmp.look.set(cam.target.x, cam.target.y, cam.target.z);
    if (!s.ready) {
      camPos.current.set(cam.position.x, cam.position.y, cam.position.z);
      camLook.current.copy(tmp.look);
      s.ready = true;
    } else {
      const k = 1 - Math.exp(-dt * 3);
      camPos.current.lerp(tmp.cam.set(cam.position.x, cam.position.y, cam.position.z), k);
      camLook.current.lerp(tmp.look, k);
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
  });

  return (
    <group ref={bike}>
      {[P.rearHub, P.frontHub].map((hub, i) => (
        <mesh
          key={i}
          ref={(el) => {
            parts.current.wheels[i] = el;
          }}
          position={hub}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[WHEEL_R, 0.025, 6, 24]} />
          <meshLambertMaterial color="#1b1b1b" />
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
