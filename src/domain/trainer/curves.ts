/**
 * Speed → power curve of a classic ("dumb") trainer:
 * P = Σ coefficients[i] · xⁱ, with x = speed in km/h × `speedScale`
 * (e.g. 1/1.609344 when the published formula uses mph).
 */
export interface TrainerCurve {
  id: string;
  name: string;
  coefficients: readonly number[];
  speedScale: number;
  /** Where the formula comes from. Curves without a verifiable source are not listed. */
  source: string;
}

const MPH_PER_KMH = 1 / 1.609344;
const GOLDEN_CHEETAH =
  'GoldenCheetah, src/Train/RealtimeController.cpp (https://github.com/GoldenCheetah/GoldenCheetah)';

/**
 * Fluid trainers with a single published curve. Magnetic trainers are left out:
 * their curve depends on the resistance level, which the app can't know.
 */
export const TRAINER_CURVES: readonly TrainerCurve[] = [
  {
    id: 'kurt-road-machine',
    name: 'Kurt Kinetic Road Machine',
    coefficients: [0, 5.24482, 0, 0.019168],
    speedScale: MPH_PER_KMH,
    source: `Kurt Kinetic (kurtkinetic.com/powercurve.php), vía ${GOLDEN_CHEETAH}`,
  },
  {
    id: 'kurt-cyclone',
    name: 'Kurt Kinetic Cyclone',
    coefficients: [0, 6.48109, 0, 0.020106],
    speedScale: MPH_PER_KMH,
    source: `Kurt Kinetic (kurtkinetic.com/powercurve.php), vía ${GOLDEN_CHEETAH}`,
  },
  {
    id: 'cycleops-fluid2',
    name: 'CycleOps Fluid²',
    coefficients: [0, 8.9788, 0.0137, 0.0115],
    speedScale: MPH_PER_KMH,
    source: `thebikegeek.blogspot.com (2009), vía ${GOLDEN_CHEETAH}`,
  },
  {
    id: 'cycleops-jetfluid-pro',
    name: 'CycleOps JetFluid Pro',
    coefficients: [0, 0.948747573756705, 0.116151236810319, 0.00400691905019749],
    speedScale: 1,
    source: GOLDEN_CHEETAH,
  },
  {
    id: 'elite-qubo-power-fluid',
    name: 'Elite Qubo Power Fluid',
    coefficients: [0, 4.31746, -0.0259259, 0.00941799],
    speedScale: 1,
    source: `powercurvesensor, vía ${GOLDEN_CHEETAH}`,
  },
  {
    id: 'elite-crono-fluid-elastogel',
    name: 'Elite Crono Fluid Elastogel',
    coefficients: [0, 2.45080842536481, -0.000562244088694063, 0.00310068317813318],
    speedScale: 1,
    source: GOLDEN_CHEETAH,
  },
  {
    id: 'elite-turbo-muin-2015',
    name: 'Elite Turbo Muin (2015)',
    coefficients: [0, 3.01523235942764, -0.120455211136354, 0.0173916556025429],
    speedScale: 1,
    source: GOLDEN_CHEETAH,
  },
];

/** Curve from user-entered coefficients: P = a·v + b·v³, v in km/h. */
export function customCurve(a: number, b: number): TrainerCurve {
  return {
    id: 'custom',
    name: 'Personalizada',
    coefficients: [0, a, 0, b],
    speedScale: 1,
    source: 'Coeficientes introducidos en Ajustes',
  };
}

export function findTrainerCurve(id: string): TrainerCurve | null {
  return TRAINER_CURVES.find((c) => c.id === id) ?? null;
}

/** Estimated power in watts at a wheel speed. Never negative; 0 when stopped. */
export function trainerPowerW(curve: TrainerCurve, speedKmh: number): number {
  if (!(speedKmh > 0)) return 0;
  const x = speedKmh * curve.speedScale;
  let power = 0;
  let xi = 1;
  for (const c of curve.coefficients) {
    power += c * xi;
    xi *= x;
  }
  return Math.max(0, power);
}

const MAX_SPEED_KMH = 100;

/**
 * Wheel speed that gives `watts` on this trainer (inverse of `trainerPowerW`), by
 * bisection. Used by the simulator to "ride" a power target. Null if out of range.
 */
export function speedForPowerKmh(curve: TrainerCurve, watts: number): number | null {
  if (!(watts > 0)) return 0;
  if (trainerPowerW(curve, MAX_SPEED_KMH) < watts) return null;
  let lo = 0;
  let hi = MAX_SPEED_KMH;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (trainerPowerW(curve, mid) < watts) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The athlete's trainer as chosen in settings. */
export interface TrainerChoice {
  /** 'none', 'custom' or the id of a listed curve. */
  modelId: string;
  /** Custom curve P = a·v + b·v³ (v in km/h). */
  customA: number;
  customB: number;
}

/** Starting point for a custom curve: the Kurt Road Machine converted to km/h. */
export const DEFAULT_TRAINER_CHOICE: TrainerChoice = {
  modelId: 'none',
  customA: 3.26,
  customB: 0.0046,
};

/** The curve to estimate power with, or null when no trainer is chosen (no power at all). */
export function curveFor(choice: TrainerChoice): TrainerCurve | null {
  if (choice.modelId === 'custom') return customCurve(choice.customA, choice.customB);
  return findTrainerCurve(choice.modelId);
}
