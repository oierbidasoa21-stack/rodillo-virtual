# Fases 6 a 9 — Pendientes

Cada fase empieza con un **plan que el usuario aprueba** antes de tocar código. Cuando una fase arranque, se crea su propio archivo `fase-N-….md` aquí y se va completando.

## Fase 6 — Grabación y exportación ⏳ (siguiente)

Milestone «Fase 6 — Grabación y exportación». Tareas del roadmap:

- Grabación a 1 Hz de todas las métricas disponibles.
- Recuperar una sesión si se cierra la pestaña por error.
- Exportar a TCX para subir a Strava o Garmin Connect.
- Detalle de cada salida en el historial con gráficas de pulso, potencia y velocidad.
- Importar y exportar workouts en formato `.zwo`.

Contexto útil: hoy el player ya muestrea la potencia a 1 Hz en memoria y acumula el pulso por zonas, pero no guarda la serie completa. `src/recording/` está vacía y prevista para esto. Las gráficas deberán seguir la skill `dataviz`. Las exportaciones son datos personales: nunca al repo.

## Fase 7 — Mundo 3D ⏳

- Carretera 3D generada a partir de la altimetría de la ruta.
- Avatar ciclista sencillo y cámara que lo sigue.
- Escenario procedural (terreno, árboles, cielo) con buen rendimiento en portátil.
- HUD de la Fase 5 superpuesto sobre la vista 3D.

Stack previsto en `CLAUDE.md`: Three.js con @react-three/fiber (dependencias nuevas que habrá que confirmar).

## Fase 8 — Rodillo inteligente (opcional) ⏳

Solo si el usuario compra uno: FTMS (0x1826), modo ERG, modo simulación.

## Fase 9 — Pruebas en móvil ⏳ (al final)

Android con Chrome (iPhone fuera: sin Web Bluetooth): instalar y modo avión, sesión completa, sensores en el móvil, ajustes de pantalla pequeña, almacenamiento persistente.
