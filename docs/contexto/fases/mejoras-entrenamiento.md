# Mejoras de entrenamiento (2026-11-26)

Pedido por el usuario tras la Fase 7: forma y fatiga, rival fantasma, avisos de voz y un puente con su agente que le plantea los entrenamientos. Fuera del roadmap (que sigue en la Fase 8 opcional).

## Plan

1. **Forma y fatiga** (`domain/metrics/fitness.ts`): carga diaria → condición (media exponencial de 42 días), fatiga (7 días) y frescura (diferencia). Panel en Historial con la gráfica de 90 días y la carga por semana (12 semanas). Las sesiones con sensores simulados no cuentan.
2. **Avisos de voz** (`audio/coach.ts`, `domain/route/climbs.ts`): pulso fuera de zona de forma sostenida (con pausa entre avisos), mitad del bloque y último minuto en bloques largos, subidas que se acercan en las rutas y resumen al terminar.
3. **Fantasma** (`recording/ghost.ts`): tu salida más rápida en la misma ruta, a partir de su grabación. Ciclista translúcido en 3D y diferencia en segundos en el HUD.
4. **Puente con el agente** (`domain/plan/`): la app exporta un informe (Markdown con JSON) de las últimas semanas y su forma, e importa un plan semanal en JSON que el agente genera con las instrucciones de `docs/agente-entrenador.md`. El plan se guarda (Dexie v5) y aparece en Sesiones con su fecha y botón para empezar.

Cada parte: lógica pura con tests, UI, lint/test/build, commit y publicación.
