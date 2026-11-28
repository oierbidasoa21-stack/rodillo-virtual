# Arquitectura

Las reglas generales están en [`CLAUDE.md`](../../../CLAUDE.md). Aquí está cómo ha quedado el código de verdad, para orientarse rápido.

## Capas

```
domain/   lógica pura, testeable en Node (ESLint prohíbe importar React o capas de la app)
sensors/  Bluetooth real, sensores simulados, decodificadores de paquetes, gestor
storage/  Dexie (IndexedDB), ajustes, copia de seguridad, almacenamiento persistente
store/    stores de Zustand: copia en memoria de lo guardado + estado de la UI
audio/    pitidos (WebAudio) y voz (es-ES), disparados por eventos del player
ui/       componentes React, un componente por archivo
```

## Módulos de `src/`

| Carpeta          | Archivos clave                                                                                       | Qué hace                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/zones`   | `zones.ts`, `athleteConfig.ts`, `powerZones.ts`                                                      | Zonas de pulso /10″ (clasificar, validar, ajustar la vecina), parser de `athlete.json` (peso, bici, rueda, zonas, FTP), zonas de potencia Coggan                                                           |
| `domain/workout` | `types.ts`, `expand.ts`, `edit.ts`, `player.ts`, `library.ts`, `ramp.ts`, `targets.ts`, `migrate.ts` | Modelo de sesión con objetivo por bloque, expansión de repeticiones, editor puro, **player como máquina de estados**, biblioteca, ramp test, conversión de objetivos a vatios, migración de datos antiguos |
| `domain/metrics` | `summary.ts`, `power.ts`, `hrTime.ts`, `load.ts`, `kcal.ts`, `timeInZone.ts`                         | Resumen de sesión y de salida en ruta, NP/IF/TSS/kJ, pulso medido, carga, kcal                                                                                                                             |
| `domain/trainer` | `curves.ts`                                                                                          | 7 curvas de rodillos de fluido (fuente: GoldenCheetah) + personalizada, y su inversa                                                                                                                       |
| `domain/physics` | `virtualSpeed.ts`                                                                                    | Velocidad virtual por bisección a partir de potencia, masa y pendiente                                                                                                                                     |
| `domain/route`   | `gpx.ts`, `route.ts`, `position.ts`, `ride.ts`, `examples.ts`                                        | Lector de GPX, remuestreo cada 10 m y suavizado, posición con vueltas, avance por potencia o por rueda, 3 rutas inventadas                                                                                 |
| `sensors`        | `types.ts`, `manager.ts`, `cscCalculator.ts`, `estimatedPower.ts`, `ble/*`, `parse/*`, `simulated/*` | Interfaz común, gestor real/simulado, Bluetooth con reconexión, decodificadores, simulados                                                                                                                 |
| `storage`        | `db.ts`, `repositories.ts`, `settings.ts`, `backup.ts`, `persist.ts`                                 | Base de datos, acceso a datos, ajustes por defecto, copia de seguridad                                                                                                                                     |
| `ui/player`      | `Player.tsx`, `Summary.tsx`, `HrCounter.tsx`, `LiveMetrics.tsx`                                      | Player, resumen, contador de 10″, métricas en directo                                                                                                                                                      |
| `ui/ride`        | `RideView.tsx`, `RideHud.tsx`, `ElevationProfile.tsx`, `MiniMap.tsx`, `RouteStrip.tsx`               | Vista de carrera y franja de ruta bajo una sesión                                                                                                                                                          |

Fase 6:

| Módulo           | Archivos                                                                                               | Para qué                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `recording`      | `recording.ts`, `recorder.ts`, `session.ts`, `tcx.ts`, `chart.ts`                                      | Muestras a 1 Hz, grabador serializable, sesión en curso, exportación TCX, datos de gráficas (código puro con tests)              |
| `domain/workout` | `zwo.ts`                                                                                               | Leer y escribir `.zwo` sin DOM                                                                                                   |
| `ui/history`     | `HistoryView.tsx`, `SessionDetail.tsx`, `SessionCharts.tsx`, `SessionChart.tsx`                        | Historial y detalle de una sesión con gráficas SVG y exportación                                                                 |
| `domain/world`   | `path.ts`, `road.ts`, `terrain.ts`                                                                     | Fase 7: ruta en metros locales, pose y cámara, cinta de carretera, suelo con campo lejano, árboles con semilla (puro, con tests) |
| `ui/world`       | `World3D.tsx`, `WorldTerrain.tsx`, `WorldRoad.tsx`, `WorldTrees.tsx`, `WorldSky.tsx`, `WorldRider.tsx` | Fase 7: escena 3D con Three.js y @react-three/fiber, cargada aparte                                                              |
| `ui/session`     | `ResumeBanner.tsx`, `saveSession.ts`                                                                   | Aviso «Sesión sin terminar» y guardado de una sesión terminada con su grabación                                                  |

## Modelo de datos (lo que se guarda)

- **`Workout`**: `{ id, name, description, blocks }`. Cada `Block` es `{ type: 'block', durationSec, target, kind, note }` y `target` es `{ type: 'hr', zoneId } | { type: 'power', pctFtp } | { type: 'watts', watts }` (`watts` solo para el ramp test). `Repeat` = `{ type: 'repeat', times, items }`, un solo nivel. Opcional `maxHr` en la sesión y en cada bloque: `{ type: 'bpm', bpm } | { type: 'zone', zoneId }` (Fase 15a, sin versión nueva de Dexie).
- **`SessionSummary`** (historial): duración, carga, kcal estimadas, tiempo por zona planificado y realizado, conteos de pulso, y opcionales `hrMeasured` (pulso medido), `power` (NP, IF, TSS, kJ, zonas, `simulated`) `ride` (ruta, distancia, desnivel, velocidad media, modo, vueltas) y `hrCap` (`{ cappedSec, aboveSec }`: segundos con tope y por encima).
- **`AppSettings`**: `athlete` (peso, bici, rueda, zonas, FTP), voz, pitidos, tema, `simulateSensors`, `trainer` (modelo o curva personalizada), `graphicsQuality` (calidad del 3D) y `downloadOnSave` (descargar el archivo al guardar). Los ids de los sensores recordados van aparte, en `localStorage` (`rodillo-virtual:remembered-sensors`), porque son una comodidad.
- **`SessionRecording`**: `{ sessionId, startMs, samples }`; cada muestra `{ t, hr, powerW, speedKmh, cadenceRpm, distanceM, altitudeM, lat, lon }` con `null` donde no hubo lectura.
- **`SessionSnapshot`** (sesión en curso): sesión o salida, estado del player o de la ruta y el grabador entero, para retomarla.
- **`RouteLandscape`** (Fase 10): `{ routeId, downloadedAtMs, tiles, failed, bytes }`. Las teselas no van en IndexedDB sino en Cache Storage (`rodillo-virtual-tiles`), y no entran en la copia de seguridad.
- **`Route`** (importadas): puntos cada 10 m `{ distanceM, lat, lon, ele }` con la altitud ya suavizada, distancia, desnivel y pendiente máxima.

## Versiones de la base de datos (Dexie, nombre `rodillo-virtual`)

| Versión Dexie | IndexedDB | Fase | Cambio                                                                                                 |
| ------------- | --------- | ---- | ------------------------------------------------------------------------------------------------------ |
| 1             | 10        | 1    | Tablas `workouts`, `history` (índice `dateMs`), `settings`                                             |
| 2             | 20        | 4    | Migración: los bloques pasan de `zoneId` a `target`                                                    |
| 3             | 30        | 5    | Tabla `routes`                                                                                         |
| 4             | 40        | 6    | Tablas `recordings` (por sesión) e `inProgress` (una fila)                                             |
| 5             | 50        | —    | Tabla `plans` (plan del agente entrenador)                                                             |
| 6             | 60        | 9    | Migración: zonas de pulso L1…VO2 → Z1…Z6 en `workouts`, `history`, `settings`, `inProgress` y `plans`  |
| 7             | 70        | 10   | Tabla `landscapes` (qué rutas GPX tienen el paisaje real descargado; las teselas van en Cache Storage) |

Cada cambio de versión tiene un test que parte de una base de la versión anterior.

## Formato de la copia de seguridad

`{ app: 'rodillo-virtual', format: 4, exportedAtMs, workouts, history, settings, routes, recordings, plans }`. Los formatos 1 (sin `routes`), 2 (sin `recordings`) y 3 (sin `plans`) se siguen leyendo, y las copias con zonas L1…VO2 se leen como Z1…Z6. La sesión en curso no entra en la copia. Al importar se valida todo, se migran las sesiones antiguas y lo que no se puede leer se descarta y se cuenta.

## Principios que se han mantenido

- **Nunca inventar datos.** Sin sensor, la métrica no aparece; sin curva de rodillo, no hay potencia; sin pulso ni potencia, carga y kcal salen como «—». Lo estimado se marca como estimado y lo simulado como SIMULADO.
- **La UI no sabe si un sensor es real o simulado**: comparten interfaz y los simulados pasan por los mismos decodificadores.
- **Todo lo calculable está en `domain/` con tests** que incluyen al menos un caso hecho a mano.
