import { expandWorkout, totalDurationSec } from './expand';
import type { Workout } from './types';

export const MIN_WORKOUT_SEC = 60;

/** Errors that block saving a workout, as messages for the user. Empty when valid. */
export function validateWorkout(workout: Pick<Workout, 'name' | 'blocks'>): string[] {
  const errors: string[] = [];
  if (!workout.name.trim()) errors.push('Ponle un nombre a la sesión para poder guardarla.');
  if (totalDurationSec(expandWorkout(workout.blocks)) < MIN_WORKOUT_SEC) {
    errors.push(
      'La sesión tiene que durar al menos 1 minuto. Revisa las duraciones de los bloques.',
    );
  }
  return errors;
}
