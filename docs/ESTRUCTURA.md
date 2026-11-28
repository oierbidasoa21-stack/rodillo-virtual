# Estructura del proyecto

Qué hay en cada carpeta y para qué sirve cada archivo. Las rutas son relativas a la raíz del repositorio.

**Cómo se reparte el código.** La lógica que calcula cosas (zonas, métricas, física, rutas, mundo 3D) está en `src/domain/`. Es pura: no sabe nada de React ni del navegador y se prueba en Node. Alrededor están los sensores (`src/sensors/`), las teselas del paisaje real (`src/tiles/`), la grabación (`src/recording/`), el almacenamiento (`src/storage/`), el estado (`src/store/`) y la interfaz (`src/ui/`).

**Tests.** Cada `nombre.test.ts` está junto al archivo que prueba (por ejemplo, `fitness.test.ts` junto a `fitness.ts`). No se listan uno a uno.

## Raíz

| Archivo                                                       | Para qué sirve                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                   | Qué es la app, cómo se usa y cómo se arranca.                                                                               |
| `CLAUDE.md`                                                   | Reglas del proyecto para Claude Code (stack, arquitectura, convenciones, forma de trabajar).                                |
| `package.json` / `package-lock.json`                          | Dependencias y scripts (`dev`, `build`, `test`, `lint`). El lock fija las versiones exactas.                                |
| `index.html`                                                  | Página de entrada que carga `src/main.tsx`.                                                                                 |
| `vite.config.ts`                                              | Configuración de Vite: ruta base (`/rodillo-virtual/` en GitHub Pages, `/` en Docker), PWA y tests.                         |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`    | TypeScript en modo estricto: para la app y para los archivos de configuración que corren en Node.                           |
| `eslint.config.js`                                            | Reglas de ESLint, incluidas las de React Hooks.                                                                             |
| `.prettierrc.json`, `.prettierignore`                         | Formato del código con Prettier y qué archivos no se formatean.                                                             |
| `.nvmrc`                                                      | Versión de Node (24) que usan CI y Docker.                                                                                  |
| `.gitignore`, `.gitattributes`                                | Qué no se sube a git (dependencias, builds, datos personales, capturas de prueba) y finales de línea.                       |
| `Dockerfile`                                                  | Imagen Docker: compila la app con Node y la sirve con nginx sin root; imágenes fijadas por digest.                          |
| `compose.yaml`                                                | `docker compose up -d` → http://localhost:8080, endurecido (solo lectura, sin capacidades). Perfil `prod`: Caddy con HTTPS. |
| `.env.example`                                                | Plantilla del `.env` (ignorado) con el dominio del perfil `prod`.                                                           |
| `.dockerignore`                                               | Qué no entra en la imagen: dependencias, `data/`, `config/*.local.json` (datos personales), `.git`, `docs/`.                |
| `LICENSE`                                                     | Todos los derechos reservados: el código se puede ver, pero no reutilizar sin permiso.                                      |
| `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`                       | Cómo proponer cambios y normas de trato.                                                                                    |
| `SECURITY.md`, `SUPPORT.md`                                   | Cómo avisar de un fallo de seguridad en privado y dónde pedir ayuda.                                                        |
| `CHANGELOG.md`                                                | Cambios por versión; lo mantiene release-please.                                                                            |
| `commitlint.config.js`                                        | Reglas de Conventional Commits que CI comprueba en cada PR.                                                                 |
| `release-please-config.json`, `.release-please-manifest.json` | Configuración de release-please y última versión publicada.                                                                 |

## Carpetas de primer nivel

| Carpeta                  | Para qué sirve                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/`     | `ci.yml`: lint, tests, build e imagen Docker. `deploy.yml`: publica en GitHub Pages desde `main`. `commitlint.yml`, `codeql.yml`, `scorecard.yml`, `release-please.yml`, `labels.yml` y `milestones.yml`: Conventional Commits, análisis de seguridad, versiones, etiquetas y milestones. |
| `.github/`               | Plantillas de issue y de PR, `CODEOWNERS`, `dependabot.yml`, `labels.json`, `milestones.json` e imagen para compartir el repo.                                                                                                                                                            |
| `config/`                | `athlete.example.json`: atleta de ejemplo (peso, bici, zonas de pulso). El tuyo va en `athlete.local.json`, que no se sube.                                                                                                                                                               |
| `docker/`                | `nginx.conf` (caché, rutas a `index.html`, sin versión), `security-headers.conf` (CSP y cabeceras, también fuente de la `<meta>` de Pages) y `Caddyfile` (HTTPS del perfil `prod`).                                                                                                       |
| `public/icons/`          | Iconos de la app y de la PWA (192, 512, maskable, Apple y SVG).                                                                                                                                                                                                                           |
| `docs/`                  | Documentación (ver abajo).                                                                                                                                                                                                                                                                |
| `src/`                   | Código de la app (ver abajo).                                                                                                                                                                                                                                                             |
| `data/`                  | _(No se sube.)_ Tus exportaciones y archivos `.tcx`, `.fit` y `.gpx` personales.                                                                                                                                                                                                          |
| `node_modules/`, `dist/` | _(No se suben.)_ Dependencias instaladas y build de producción.                                                                                                                                                                                                                           |

## `docs/`

| Ruta                                | Para qué sirve                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ROADMAP.md`                        | Fases del proyecto con sus tareas marcadas.                                                                   |
| `ESTRUCTURA.md`                     | Este documento.                                                                                               |
| `MANUAL.md`                         | Manual de uso de toda la app, para personas, con capturas.                                                    |
| `manual/`                           | Capturas del manual (PNG a 1280×900, con sensores simulados y el atleta de ejemplo).                          |
| `despliegue/README.md`              | Cómo se publica la app (Pages, Docker, `prod`), cada pieza de seguridad, cómo actualizar y cómo volver atrás. |
| `agente-entrenador.md`              | Cómo conectar la app con tu agente entrenador (informe hacia el agente y plan semanal de vuelta).             |
| `reference/rodillo-pulso-v1.html`   | La versión 1 en un solo HTML: referencia funcional de la Fase 1.                                              |
| `contexto/README.md`                | Cómo se organiza el contexto entre conversaciones y qué se actualiza tras cada tarea.                         |
| `contexto/estado/ESTADO.md`         | Dónde está el proyecto ahora mismo.                                                                           |
| `contexto/fases/`                   | El plan de cada fase y de cada tanda de mejoras, escrito antes de empezarla.                                  |
| `contexto/decisiones/DECISIONES.md` | Decisiones técnicas y de producto, con su motivo.                                                             |
| `contexto/arquitectura/`            | Mapa de módulos y cómo encajan.                                                                               |
| `contexto/pruebas/PRUEBAS.md`       | Qué se comprobó en cada fase y cómo.                                                                          |
| `contexto/pruebas/scripts/`         | Scripts de prueba en navegador headless (demo 3D, forma, fantasma, voz, plan…).                               |
| `contexto/pendientes/PENDIENTES.md` | Lo que falta o está a medias.                                                                                 |
| `contexto/registro/CAMBIOS.md`      | Registro de commits por fase.                                                                                 |
| `contexto/sesiones/`                | Resumen de cada sesión de trabajo.                                                                            |

## `src/`

| Archivo    | Para qué sirve                                           |
| ---------- | -------------------------------------------------------- |
| `main.tsx` | Arranque: carga las fuentes y los estilos y monta React. |

### `src/domain/` — lógica pura, con tests

**`zones/`** · zonas de pulso y de potencia

| Archivo            | Para qué sirve                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `zones.ts`         | Zonas Z1–Z6 contadas en 10″: buscar una zona, clasificar un valor, dentro/encima/debajo, validar; nombres antiguos (L1…VO2). |
| `legacy.ts`        | Renombra L1…VO2 a Z1…Z6 en cualquier dato guardado (migración de la base, copias, archivo de atleta).                        |
| `heartRate.ts`     | Pasar de la cuenta en 10″ a ppm y al revés.                                                                                  |
| `powerZones.ts`    | Zonas de potencia a partir del FTP.                                                                                          |
| `athleteConfig.ts` | Esquema y validación de `config/athlete.*.json` (peso, bici, zonas).                                                         |

**`workout/`** · sesiones estructuradas

| Archivo       | Para qué sirve                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `types.ts`    | Modelo de sesión: bloques (calentamiento, serie, recuperación…), objetivos (zona, % FTP, vatios), repeticiones.  |
| `expand.ts`   | Despliega las repeticiones en una lista de pasos y calcula la duración total.                                    |
| `player.ts`   | Reproductor como máquina de estados: avance por segundos, aviso a 10 s, cuenta atrás, saltar, alargar, terminar. |
| `targets.ts`  | Vatios objetivo de un bloque y banda de ±5 % alrededor.                                                          |
| `edit.ts`     | Operaciones del editor: añadir, mover, duplicar y borrar bloques y repeticiones.                                 |
| `validate.ts` | Comprueba que una sesión es válida antes de guardarla.                                                           |
| `migrate.ts`  | Convierte sesiones guardadas con el modelo antiguo (antes de la Fase 4).                                         |
| `library.ts`  | Sesiones de ejemplo que trae la app.                                                                             |
| `ramp.ts`     | Test de rampa: escalones de vatios y FTP estimado al terminar.                                                   |
| `zwo.ts`      | Importar y exportar sesiones en formato `.zwo`.                                                                  |

**`metrics/`** · métricas de cada sesión y de la forma

| Archivo         | Para qué sirve                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| `summary.ts`    | Resumen de una sesión terminada (duración, carga, kcal, pulso, potencia, ruta). |
| `hrTime.ts`     | Tiempo en cada zona a partir del pulso medido.                                  |
| `timeInZone.ts` | Tiempo por zona planificado y realizado según los bloques.                      |
| `load.ts`       | Carga por pulso: minutos en zona × peso de la zona.                             |
| `power.ts`      | NP, IF, TSS, kJ, potencia media y máxima.                                       |
| `kcal.ts`       | kcal estimadas (por MET y zona, o a partir de kJ).                              |
| `fitness.ts`    | Condición (42 días), fatiga (7 días) y frescura, y totales por semana.          |

**`physics/`**

| Archivo           | Para qué sirve                                                                       |
| ----------------- | ------------------------------------------------------------------------------------ |
| `virtualSpeed.ts` | Velocidad virtual a partir de potencia, peso y pendiente (aire, rodadura, gravedad). |

**`trainer/`**

| Archivo     | Para qué sirve                                                                                |
| ----------- | --------------------------------------------------------------------------------------------- |
| `curves.ts` | Curvas velocidad → potencia de rodillos «tontos», cada una con su fuente, y la personalizada. |

**`route/`** · rutas

| Archivo       | Para qué sirve                                                                       |
| ------------- | ------------------------------------------------------------------------------------ |
| `route.ts`    | Modelo de ruta: remuestreo, distancias, pendiente, desnivel.                         |
| `gpx.ts`      | Leer archivos GPX.                                                                   |
| `examples.ts` | Las tres rutas de ejemplo, inventadas (Embalse, Puerto, Rompepiernas).               |
| `position.ts` | Dónde estás en la ruta a una distancia: coordenadas, altura y pendiente.             |
| `ride.ts`     | Avance por la ruta en cada instante, por potencia (física) o por velocidad de rueda. |
| `climbs.ts`   | Detecta las subidas de una ruta (para los avisos de voz).                            |

**`world/`** · geometría del mundo 3D

| Archivo          | Para qué sirve                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `path.ts`        | Proyecta la ruta a metros locales y la suaviza (spline cada metro); pose del ciclista (rumbo desde la tangente) y posición de la cámara. |
| `road.ts`        | Mallas de carretera, arcenes, líneas central y laterales, y balizas.                                                                     |
| `terrain.ts`     | Suelo: ruido, colinas, altura junto a la carretera, rejilla del terreno, generador aleatorio con semilla.                                |
| `scenery.ts`     | Árboles, matorrales y rocas a lo largo de la carretera, y anillo de montañas del horizonte.                                              |
| `roadside.ts`    | Público (más en subidas, curvas, salida y llegada) y quitamiedos en las curvas cerradas.                                                 |
| `realTerrain.ts` | Paisaje real (Fase 10): corrección de altura del GPX (mediana), suelo real fundido con la carretera, rejilla cercana y horizonte lejano. |
| `quality.ts`     | Niveles de calidad del 3D (baja, media y alta), también para el terreno real y su alcance.                                               |

**`plan/`** · puente con el agente entrenador

| Archivo           | Para qué sirve                                                                      |
| ----------------- | ----------------------------------------------------------------------------------- |
| `plan.ts`         | Leer el plan semanal (`rodillo-virtual/plan@1`) con todos sus errores; días hechos. |
| `report.ts`       | Informe para el agente: zonas, forma y sesiones de las últimas 4 semanas.           |
| `instructions.ts` | Instrucciones para el agente (las que se descargan desde la app).                   |

**`geo/`** · paisaje real (Fase 10)

| Archivo         | Para qué sirve                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `mercator.ts`   | Teselas Web Mercator: lon/lat ↔ tesela, teselas que cubren una zona, zona alrededor de una ruta.                                      |
| `terrarium.ts`  | Leer la altura guardada en los colores de una tesela de relieve (Terrarium).                                                          |
| `heights.ts`    | Mosaico de alturas con interpolación bilineal; sin dato donde falta una tesela, nunca una supuesta.                                   |
| `localFrame.ts` | Metros locales del mundo 3D ↔ lon/lat (el mismo marco que la carretera).                                                              |
| `landscape.ts`  | Qué teselas necesita el paisaje de una ruta (cerca y horizonte) y cuánto pesan.                                                       |
| `imagery.ts`    | Mosaico de fotos de satélite: qué teselas, a cuántos píxeles caben en una textura y coordenadas de textura de cada punto del terreno. |

### `src/tiles/` — descarga y caché de teselas (Fase 10)

| Archivo       | Para qué sirve                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sources.ts`  | Direcciones de los dos servidores de teselas (los únicos que admite la CSP) y su atribución.                       |
| `download.ts` | Descarga con pocas peticiones a la vez, progreso, cancelación y fallos sin inventar nada.                          |
| `cache.ts`    | Guardar, leer y borrar teselas en Cache Storage (`rodillo-virtual-tiles`), para usarlas sin conexión.              |
| `decode.ts`   | Pasar una tesela de relieve a alturas en el navegador.                                                             |
| `heights.ts`  | Leer de la caché las teselas de relieve de una ruta GPX ya descargadas; sin ninguna, la vista 3D es la de siempre. |
| `imagery.ts`  | Componer las fotos de satélite guardadas de una ruta en una imagen; donde falta una tesela, color neutro.          |
| `csp.test.ts` | Comprueba que `connect-src` de la CSP y la lista de servidores coinciden.                                          |

### `src/sensors/` — sensores (Web Bluetooth y simulados)

| Archivo                        | Para qué sirve                                                              |
| ------------------------------ | --------------------------------------------------------------------------- |
| `types.ts`                     | Interfaz común de sensor y lecturas (con su origen: real o simulado).       |
| `sensorBase.ts`                | Gestión de estado y suscriptores, compartida por todos los sensores.        |
| `manager.ts`                   | Un sensor por tipo; copia su estado y sus lecturas a la store.              |
| `freshness.ts`                 | Cuándo una lectura deja de valer (si tiene más de 5 s, no se muestra).      |
| `cscCalculator.ts`             | Velocidad y cadencia a partir de las vueltas de rueda y de biela.           |
| `estimatedPower.ts`            | Potencia estimada con la curva del rodillo (siempre marcada como estimada). |
| `ble/bleSensor.ts`             | Base Bluetooth: conectar, suscribirse y reconectar.                         |
| `ble/heartRateSensor.ts`       | Banda de pulso (servicio 0x180D).                                           |
| `ble/cscSensor.ts`             | Sensor de velocidad y cadencia (servicio 0x1816).                           |
| `parse/heartRate.ts`           | Interpreta los mensajes de la banda (ppm, contacto, intervalos RR).         |
| `parse/csc.ts`                 | Interpreta los mensajes del sensor de velocidad y cadencia.                 |
| `simulated/simulatedSensor.ts` | Base de los sensores simulados.                                             |
| `simulated/simulatedHr.ts`     | Pulso simulado que tiende al objetivo.                                      |
| `simulated/simulatedCsc.ts`    | Velocidad y cadencia simuladas.                                             |
| `simulated/follow.ts`          | El simulador sigue la zona o la potencia del bloque en curso.               |
| `simulated/clock.ts`           | Reloj inyectable para que los tests controlen el tiempo.                    |

### `src/recording/` — grabación y archivos

| Archivo        | Para qué sirve                                                                       |
| -------------- | ------------------------------------------------------------------------------------ |
| `recording.ts` | Muestras a 1 Hz (pulso, potencia, velocidad, cadencia, distancia, altura, posición). |
| `recorder.ts`  | Graba en cada tick lo que dan los sensores y la posición en la ruta.                 |
| `session.ts`   | Foto de la sesión en curso (para retomarla) y grabación guardada.                    |
| `tcx.ts`       | Exportar a TCX (Strava, Garmin…).                                                    |
| `chart.ts`     | Datos para las gráficas del historial (medias por tramo, huecos, marcas del eje).    |
| `ghost.ts`     | Fantasma: reproduce tu mejor salida en la ruta y calcula la diferencia.              |

### `src/storage/` — datos en el navegador (IndexedDB con Dexie)

| Archivo           | Para qué sirve                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `db.ts`           | Tablas y versiones de la base de datos, con sus migraciones (v5: planes; v6: zonas Z1…Z6). |
| `repositories.ts` | Leer y guardar sesiones, historial, grabaciones, rutas, planes y ajustes.                  |
| `settings.ts`     | Ajustes con sus valores por defecto (atleta de ejemplo, voz, pitidos, tema…).              |
| `backup.ts`       | Copia de seguridad: exportar e importar todo en un JSON (formato 4).                       |
| `persist.ts`      | Pide al navegador almacenamiento persistente, para que no borre los datos.                 |

### `src/store/` — estado de la app (Zustand)

| Archivo              | Para qué sirve                                                 |
| -------------------- | -------------------------------------------------------------- |
| `loadAll.ts`         | Carga todas las stores desde IndexedDB al arrancar.            |
| `uiStore.ts`         | Pestaña activa, sesión o ruta en marcha, demo, editor, avisos. |
| `settingsStore.ts`   | Ajustes (atleta, zonas, rodillo, voz, tema).                   |
| `workoutsStore.ts`   | Sesiones propias.                                              |
| `historyStore.ts`    | Historial.                                                     |
| `routesStore.ts`     | Rutas importadas de GPX.                                       |
| `plansStore.ts`      | Planes del agente entrenador.                                  |
| `sensorsStore.ts`    | Estado y última lectura de cada sensor.                        |
| `simulationStore.ts` | Parámetros de los sensores simulados.                          |

### `src/audio/` — sonido y voz

| Archivo            | Para qué sirve                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `beeper.ts`        | Pitidos con Web Audio.                                                                    |
| `speech.ts`        | Voz en español con la síntesis de voz del navegador.                                      |
| `announcements.ts` | Textos que se dicen al empezar cada bloque y 10 s antes de cambiar.                       |
| `cues.ts`          | Convierte los eventos del reproductor en pitidos y voz.                                   |
| `coach.ts`         | Avisos de entrenador: pulso fuera de zona, mitad y último minuto, subidas, resumen final. |

### `src/ui/` — interfaz (React)

**Generales**

| Archivo                          | Para qué sirve                                                    |
| -------------------------------- | ----------------------------------------------------------------- |
| `App.tsx`                        | Pestañas y qué pantalla se ve (reproductor, ruta, demo, editor…). |
| `Tabs.tsx`                       | Barra de pestañas.                                                |
| `Toast.tsx`                      | Mensajes breves.                                                  |
| `ConfirmButton.tsx`              | Botón que pide una segunda pulsación para acciones que borran.    |
| `NumberInput.tsx`                | Campo numérico con límites.                                       |
| `WorkoutProfile.tsx`             | Perfil de bloques de una sesión, coloreado por zona.              |
| `ZoneStrip.tsx`                  | Franja con las zonas de pulso.                                    |
| `format.ts`                      | Formato de tiempos, minutos y zonas.                              |
| `download.ts`                    | Descargar archivos (TCX, .zwo, copia de seguridad, informe).      |
| `zoneStyle.ts`, `targetStyle.ts` | Colores por zona y por tipo de objetivo.                          |

**Pantallas y piezas**

| Carpeta     | Para qué sirve                                                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `library/`  | Pestaña Sesiones: `LibraryView` (lista, importar y exportar `.zwo`) y `WorkoutCard` (cada sesión).                                                                                                                                                                        |
| `plan/`     | `PlanCard`: plan del entrenador (copiar informe, instrucciones, importar plan, empezar cada día).                                                                                                                                                                         |
| `editor/`   | Editor de sesiones: `EditorSheet`, `BlockRow`, `RepeatGroup`, `ItemControls`, `TargetInput`.                                                                                                                                                                              |
| `player/`   | Reproductor de sesiones: `Player`, métricas en vivo, contador de pulso de 10″, alertas de sensores y resumen final.                                                                                                                                                       |
| `ramp/`     | Test de rampa: tarjeta para empezarlo y resultado con el FTP estimado.                                                                                                                                                                                                    |
| `routes/`   | Pestaña Rutas: `RoutesView`, `RouteCard` (cada ruta, importar GPX) y `DemoCard` (demo 3D).                                                                                                                                                                                |
| `ride/`     | Rodar una ruta: `RideView`, HUD, perfil, minimapa, franja 2D, etiqueta del fantasma, modo y resumen.                                                                                                                                                                      |
| `world/`    | Vista 3D (Three.js): escena, terreno, horizonte, carretera, árboles, matorrales, público, quitamiedos, cielo, sol, ciclista y, con paisaje real descargado, terreno y horizonte reales con la foto de satélite encima (sin árboles ni rocas inventados). Se carga aparte. |
| `history/`  | Pestaña Historial: lista, panel de forma, gráficas de condición y fatiga y de carga semanal, y detalle de cada sesión.                                                                                                                                                    |
| `sensors/`  | Pestaña Sensores: conectar banda y sensor, y sensores simulados para desarrollar.                                                                                                                                                                                         |
| `settings/` | Pestaña Ajustes: atleta y zonas, rodillo, copia de seguridad y archivo de atleta.                                                                                                                                                                                         |
| `session/`  | Guardar una sesión al terminar y aviso para retomar una sin terminar.                                                                                                                                                                                                     |
| `pwa/`      | Registro del service worker y aviso de actualización de la PWA, que espera si hay una sesión en marcha.                                                                                                                                                                   |
| `hooks/`    | Hooks: reloj del reproductor, grabación, guardado continuo, voz, pantalla siempre encendida, tema, ancho de un elemento…                                                                                                                                                  |
| `styles/`   | CSS: `tokens.css` (colores de los temas claro y oscuro), `app.css`, `player.css`, `ride.css`, `editor.css`.                                                                                                                                                               |
