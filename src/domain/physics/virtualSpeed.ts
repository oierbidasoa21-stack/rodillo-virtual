/** Constants from CLAUDE.md (road bike, rider on the hoods, sea level). */
export const PHYSICS = {
  drivetrainEfficiency: 0.975,
  airDensity: 1.225,
  cdA: 0.32,
  crr: 0.005,
  g: 9.81,
} as const;

/**
 * Power needed to hold `speedMs` on a slope, before drivetrain losses:
 * (½·ρ·CdA·v² + Crr·m·g·cosθ + m·g·sinθ)·v. `grade` is rise/run (0.05 = 5 %).
 */
export function resistivePowerW(speedMs: number, massKg: number, grade: number): number {
  const theta = Math.atan(grade);
  const { airDensity, cdA, crr, g } = PHYSICS;
  const force =
    0.5 * airDensity * cdA * speedMs * speedMs +
    crr * massKg * g * Math.cos(theta) +
    massKg * g * Math.sin(theta);
  return force * speedMs;
}

const MAX_SPEED_MS = 40; // 144 km/h: well above anything on a trainer

/**
 * Steady speed (m/s) for a rider pushing `powerW` on a slope: solves
 * P·η = resistive power(v) by bisection. Downhill the bike rolls even at 0 W.
 */
export function virtualSpeedMs(powerW: number, massKg: number, grade = 0): number {
  const target = Math.max(0, powerW) * PHYSICS.drivetrainEfficiency;
  // Resistive power is negative only while gravity pulls harder than drag + rolling;
  // the solution is where it reaches the rider's power.
  if (resistivePowerW(MAX_SPEED_MS, massKg, grade) < target) return MAX_SPEED_MS;
  let lo = 0;
  let hi = MAX_SPEED_MS;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (resistivePowerW(mid, massKg, grade) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
