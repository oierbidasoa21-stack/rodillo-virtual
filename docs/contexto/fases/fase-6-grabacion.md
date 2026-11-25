# Fase 6 — Grabación y exportación ✅ (con simulados)

**Fechas:** 2026-11-25 · **Rama:** `feat/recording` · **Milestone:** Fase 6 (cerrado, issues #1–#5)

## Objetivo

Guardar cada salida segundo a segundo, no perderla si se cierra la pestaña, exportarla a TCX para Strava o Garmin, verla en detalle con gráficas e intercambiar sesiones en `.zwo`.

## Plan (trabajo en automático, sin aprobación)

### Bloque A — Grabación y recuperación (#1, #2)

1. **`src/recording/recording.ts`** (puro, con tests): una muestra por segundo `{ t, hr, powerW, speedKmh, cadenceRpm, distanceM, altitudeM, lat, lon }`. Lo que falta va como `null`, nunca inventado. Solo se graba con el reloj en marcha (las pausas no cuentan).
2. **Distancia sin ruta**: se integra la velocidad real de la rueda (si hay sensor). En ruta, la distancia y la velocidad de la ruta (virtual o de rueda), más altitud y coordenadas.
3. **Hook `useSessionRecorder`** que comparten el player y la vista de carrera: pulso por zonas, potencia a 1 Hz, grabación y distancia. Quita código duplicado.
4. **Dexie v4**: tablas `recordings` (una por sesión del historial) e `inProgress` (la sesión en curso). Migración v3 → v4 con test. La copia de seguridad pasa al formato 3 con las grabaciones.
5. **Recuperación**: la sesión en curso se guarda cada 10 s, al pausar y al ocultar o cerrar la pestaña. Al volver a abrir la app aparece «Sesión sin terminar» con **Retomar** (sigue en pausa donde estaba), **Guardar** (la cierra con lo hecho) y **Descartar**.

### Bloque B — TCX y detalle (#3, #4)

6. **`src/recording/tcx.ts`** (puro, con tests): TCX 2 con `Activity Sport="Biking"`, una vuelta, puntos por segundo con pulso, cadencia, distancia, altitud y posición si existen, y velocidad y vatios en las extensiones `TPX`. Nombre `rodillo-AAAA-MM-DD-HHMM-<sesión>.tcx`.
7. **Detalle de cada salida** desde el historial: el resumen de siempre, gráficas de pulso, potencia y velocidad (siguiendo la skill `dataviz`), **Exportar TCX** y borrar la salida. Las salidas anteriores a la Fase 6 no tienen grabación y lo dicen.

### Bloque C — `.zwo` (#5)

8. **`src/domain/workout/zwo.ts`** (puro, con tests): leer `SteadyState`, `Warmup`/`Cooldown`/`Ramp` (en escalones de 1′ del inicio al final, sin inventar otra cosa), `IntervalsT` (repetición), `FreeRide` y `MaxEffort`, y escribir nuestras sesiones. Los bloques por pulso, que `.zwo` no admite, se exportan como `FreeRide` con la zona en un `textevent`, y se avisa.
9. **Biblioteca**: «Importar .zwo» y «Exportar .zwo» en cada sesión.

### Cierre

10. README, contexto, roadmap, cerrar issues #1–#5 y el milestone, push, CI y Deploy, y prueba contra la web publicada.

## Decisiones de esta fase

- La grabación vive en `src/recording/` (como dice `CLAUDE.md`); es código puro y testeable aunque no esté en `domain/`.
- TCX en vez de FIT: es texto, Strava y Garmin Connect lo aceptan y se puede generar sin dependencias.
- Las rampas de `.zwo` se convierten en escalones de 1 minuto porque nuestro modelo de bloque tiene un objetivo fijo.
- **Retomar = seguir en pausa.** «Retomar» abre la sesión en pausa donde estaba; el tiempo con la app cerrada no cuenta. En el TCX los segundos van seguidos desde el inicio (tiempo en movimiento), sin el hueco.
- **«Guardar» desde el aviso** usa la hora de inicio de la sesión como fecha del historial.
- **Potencia** se graba siempre que haya curva de rodillo, también en modo rueda (antes la vista de carrera solo la guardaba en modo potencia).
- **Gráficas:** una por dato (nunca dos escalas en una), mismo eje de tiempo, cruz compartida y lectura de valores arriba; una sola serie por gráfica, así que sin leyenda; el pulso lleva de fondo los colores de las zonas. SVG propio, sin librería: son líneas sencillas y así la app no pesa más.
- **`.zwo`:** un `FreeRide` ajeno se importa como bloque por pulso en L2 («Rodaje libre») y `MaxEffort` en VO2, con aviso, porque nuestro bloque necesita un objetivo. Las repeticiones que no son «trabajo + descanso por potencia» se escriben desplegadas (`.zwo` no tiene repetición general).

## Qué se hizo

- **`src/recording/`**: `recording.ts` (una muestra por segundo), `recorder.ts` (pulso por zonas, potencia, muestras y distancia de rueda; serializable), `session.ts` (instantánea de la sesión en curso y resumen a partir de ella), `tcx.ts` y `chart.ts` (datos para las gráficas). Todo con tests.
- **Dexie v4**: tablas `recordings` e `inProgress`, migración v3 → v4 con test; copia de seguridad formato 3 con grabaciones.
- **Player y vista de carrera** comparten `useSessionRecorder`; `useInProgressSaver` guarda la sesión cada 10 s, al pausar y al ocultar la pestaña.
- **Aviso «Sesión sin terminar»** con Retomar, Guardar y Descartar.
- **Detalle en el historial**: resumen, gráficas de pulso, potencia, velocidad, cadencia y altitud, Exportar TCX y Borrar sesión.
- **`.zwo`**: `src/domain/workout/zwo.ts` (leer y escribir sin DOM) y botones en la biblioteca.

## Comprobación

En navegador headless con sensores simulados (scripts en `pruebas/scripts/fase6-*.mjs`):

- **Recuperar:** sesión de 95 s → 90 muestras guardadas → recarga → aviso «Sesión sin terminar · 1:30» → Retomar (en pausa) → 10 s más → Terminar: historial con 100 s y grabación de 100 muestras con el mismo id; no queda sesión en curso.
- **Detalle y TCX:** salida de 4′ por la Vuelta al Embalse con curva de rodillo → 5 gráficas, lectura con el ratón, TCX de 240 puntos con vatios, posición y la nota de estimado y simulado; Borrar la quita.
- **`.zwo`:** exportar «Tempo 3×12′ L3» e importarlo da la misma sesión (1 h 11′); un archivo con rampa avisa de los escalones; uno que no es `.zwo` da error.

## Pendiente

Prueba con sensores reales y subir un TCX de verdad a Strava o Garmin Connect.
