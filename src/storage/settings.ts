import example from '../../config/athlete.example.json';
import {
  DEFAULT_TRAINER_CHOICE,
  TRAINER_CURVES,
  type TrainerChoice,
} from '../domain/trainer/curves';
import { type AthleteConfig, parseAthleteConfig } from '../domain/zones/athleteConfig';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  athlete: AthleteConfig;
  voice: boolean;
  beeps: boolean;
  theme: ThemePreference;
  /** Use simulated sensors instead of Bluetooth (Ajustes → Desarrollo). Data is always labelled. */
  simulateSensors: boolean;
  /** Trainer whose speed → power curve estimates watts. 'none' by default: no power. */
  trainer: TrainerChoice;
}

function exampleAthlete(): AthleteConfig {
  const parsed = parseAthleteConfig(example);
  if (!parsed.ok) throw new Error(`Invalid athlete.example.json: ${parsed.errors.join(' ')}`);
  return parsed.value;
}

/** Defaults: example athlete (never personal data), voice and beeps on, system theme. */
export function defaultSettings(): AppSettings {
  return {
    athlete: exampleAthlete(),
    voice: true,
    beeps: true,
    theme: 'system',
    simulateSensors: false,
    trainer: { ...DEFAULT_TRAINER_CHOICE },
  };
}

const finite = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function normalizeTrainer(v: unknown): TrainerChoice {
  if (typeof v !== 'object' || v === null) return { ...DEFAULT_TRAINER_CHOICE };
  const t = v as Partial<TrainerChoice>;
  const known =
    t.modelId === 'none' ||
    t.modelId === 'custom' ||
    TRAINER_CURVES.some((c) => c.id === t.modelId);
  return {
    modelId: known && typeof t.modelId === 'string' ? t.modelId : 'none',
    customA: finite(t.customA, DEFAULT_TRAINER_CHOICE.customA),
    customB: finite(t.customB, DEFAULT_TRAINER_CHOICE.customB),
  };
}

/**
 * Fills in anything missing or invalid in stored settings with defaults,
 * so older records keep working when new settings are added.
 */
export function normalizeSettings(stored: Partial<AppSettings> | undefined): AppSettings {
  const defaults = defaultSettings();
  if (!stored) return defaults;
  const athlete = parseAthleteConfig(stored.athlete);
  return {
    athlete: athlete.ok ? athlete.value : defaults.athlete,
    voice: typeof stored.voice === 'boolean' ? stored.voice : defaults.voice,
    beeps: typeof stored.beeps === 'boolean' ? stored.beeps : defaults.beeps,
    theme:
      stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system'
        ? stored.theme
        : defaults.theme,
    simulateSensors:
      typeof stored.simulateSensors === 'boolean'
        ? stored.simulateSensors
        : defaults.simulateSensors,
    trainer: normalizeTrainer(stored.trainer),
  };
}
