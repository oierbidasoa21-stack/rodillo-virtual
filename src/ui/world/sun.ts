import { Vector3 } from 'three';
import type { TimeOfDay } from './timeOfDay';

/** Everything that changes with the hour: sun, sky, haze and ambient light. */
export interface Lighting {
  /** Direction towards the sun. */
  sunDirection: Vector3;
  sunColor: string;
  sunIntensity: number;
  /** Hemisphere light: sky colour, ground colour, intensity. */
  hemi: [string, string, number];
  /** Sky at the horizon (also the haze colour) and overhead. */
  horizon: string;
  zenith: string;
}

export const LIGHTING: Record<TimeOfDay, Lighting> = {
  morning: {
    sunDirection: new Vector3(0.55, 0.62, 0.42).normalize(),
    sunColor: '#fff3df',
    sunIntensity: 2.6,
    hemi: ['#dcecff', '#5d6b3a', 1.25],
    horizon: '#cfe3f2',
    zenith: '#4f8bcb',
  },
  noon: {
    sunDirection: new Vector3(0.2, 0.95, 0.25).normalize(),
    sunColor: '#ffffff',
    sunIntensity: 2.9,
    hemi: ['#e2f0ff', '#5d6b3a', 1.35],
    horizon: '#d8e9f6',
    zenith: '#3b7cc6',
  },
  evening: {
    sunDirection: new Vector3(-0.78, 0.17, 0.6).normalize(),
    sunColor: '#ffad6b',
    sunIntensity: 2.3,
    hemi: ['#ffd7b0', '#4a4030', 0.85],
    horizon: '#f2c194',
    zenith: '#5a77ad',
  },
};
