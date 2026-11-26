/** Hours of the day the 3D world can show (kept apart from Three.js so the main bundle stays small). */
export type TimeOfDay = 'morning' | 'noon' | 'evening';

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: 'Mañana',
  noon: 'Mediodía',
  evening: 'Atardecer',
};
