import example from '../../config/athlete.example.json';
import { type AthleteConfig, parseAthleteConfig } from '../domain/zones/athleteConfig';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  athlete: AthleteConfig;
  voice: boolean;
  beeps: boolean;
  theme: ThemePreference;
}

function exampleAthlete(): AthleteConfig {
  const parsed = parseAthleteConfig(example);
  if (!parsed.ok) throw new Error(`Invalid athlete.example.json: ${parsed.errors.join(' ')}`);
  return parsed.value;
}

/** Defaults: example athlete (never personal data), voice and beeps on, system theme. */
export function defaultSettings(): AppSettings {
  return { athlete: exampleAthlete(), voice: true, beeps: true, theme: 'system' };
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
  };
}
