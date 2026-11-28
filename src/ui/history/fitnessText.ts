import type { FreshnessLevel } from '../../domain/metrics/fitness';

/** What each freshness level means, for the user. */
export const LEVEL_TEXT: Record<FreshnessLevel, string> = {
  fresh: 'Fresco: buen momento para una sesión dura o una prueba.',
  balanced: 'Equilibrado: entrenando sin acumular fatiga de más.',
  loaded: 'Cargado: estás construyendo condición; cuida el descanso.',
  overloaded: 'Muy cargado: conviene un día suave o de descanso.',
};
