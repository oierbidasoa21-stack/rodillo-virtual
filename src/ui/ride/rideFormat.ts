const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `12,3 km` */
export function formatKm(metres: number): string {
  return `${oneDecimal.format(metres / 1000)} km`;
}

/** `+6,2 %`, `−3,0 %`, `0,0 %` */
export function formatGrade(grade: number): string {
  const pct = Math.round(grade * 1000) / 10;
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  return `${sign}${oneDecimal.format(Math.abs(pct))} %`;
}

/** Colour for a gradient: flat or down, gentle, hard, very hard. */
export function gradeColor(raw: number): string {
  // Rounded to 0.1 % first, so a steady 5 % climb doesn't flicker across the 5 % boundary.
  const grade = Math.round(raw * 1000) / 1000;
  if (grade < 0.02) return 'var(--z1)';
  if (grade < 0.05) return 'var(--z3)';
  if (grade < 0.08) return 'var(--z4)';
  return 'var(--z5)';
}
