# Roadmap — Rodillo Virtual

Una fase a la vez. Cada fase termina con la app funcionando, desplegada y con los tests en verde.
Marca `[x]` al completar cada tarea.

Los criterios de «hecho» se comprueban en el **ordenador (Chrome en Windows)**, con la web publicada. La app es solo para ordenador: no hay fase de móvil.

**Fase actual: 9 (mantenimiento).**

**Orden de ejecución:** 9 → 13 → 14 → 15a → 10 → T14 → 11 → 12 → 15b → T13 → T19. Los números no cambian; la 8 entra cuando haya rodillo inteligente. Las tareas Tn y el porqué del orden están en `docs/contexto/pendientes/PENDIENTES.md` (T2).

---

## Fase 0 — Base del proyecto

Objetivo: repositorio limpio, herramientas configuradas y despliegue automático.

- [x] Proyecto Vite + React + TypeScript (`strict`)
- [x] ESLint + Prettier configurados, script `npm run lint`
- [x] Vitest configurado, con un test de ejemplo en `src/domain/`
- [x] Estructura de carpetas de `CLAUDE.md` creada
- [x] `.gitignore` con `node_modules/`, `dist/`, `data/`
- [x] GitHub Actions: lint + test + build en cada push y PR
- [x] Despliegue en GitHub Pages desde `main`
- [x] `README.md` con descripción y comandos

Hecho cuando: la página vacía se abre desde la URL de GitHub Pages y el workflow pasa en verde.

## Fase 1 — Port de la v1 (workout player por pulso)

Objetivo: todo lo que hace `docs/reference/rodillo-pulso-v1.html`, con arquitectura modular.

- [x] `domain/zones`: zonas de pulso /10″ configurables, clasificación de un valor
- [x] `domain/workout`: modelo de bloques y repeticiones, expansión a lista plana, duración total (con tests)
- [x] `domain/metrics`: carga por zonas y kcal por MET (con tests)
- [x] `storage`: Dexie con sesiones propias, historial y ajustes
- [x] Biblioteca con las 8 sesiones de la v1
- [x] Editor de sesiones (bloques, repeticiones, mover, borrar)
- [x] Player: zona actual, cuenta atrás, perfil con cursor, siguiente bloque, pausa, +1′, saltar, terminar
- [x] Audio: pitidos (10 s y 3-2-1) y voz en español, activables
- [x] Wake Lock para mantener la pantalla encendida
- [x] Contador de pulso de 10″ con teclado numérico
- [x] Resumen: tiempo en zona realizado frente a planificado, carga, kcal, conteos
- [x] Historial con totales de 7 días

Hecho cuando: puedo hacer una sesión completa en el ordenador igual que con la v1.

## Fase 2 — PWA

Objetivo: instalar la app y usarla sin conexión una vez cargada.

- [x] Manifest (nombre, iconos, colores, `display: standalone`, `scope` en `/rodillo-virtual/`)
- [x] Iconos propios (192, 512, maskable y apple-touch-icon)
- [x] Service worker que precarga toda la app (JS, CSS, fuentes e iconos)
- [x] Aviso de nueva versión que nunca recarga a mitad de una sesión
- [x] Almacenamiento persistente para que el navegador no borre sesiones e historial
- [x] Instalación y uso sin conexión documentados en el README

Hecho cuando: instalo la app desde Chrome en Windows, la abro sin conexión y puedo hacer una sesión completa.

## Fase 3 — Sensores Bluetooth

Objetivo: leer sensores reales, y simularlos para desarrollar sin hardware.

- [x] Interfaz común de sensor (conectar, desconectar, lecturas con timestamp, estado)
- [x] Sensor simulado de pulso, velocidad y cadencia (activable en ajustes de desarrollo)
- [x] Heart Rate Service (0x180D)
- [x] Circunferencia de rueda configurable (2155 mm por defecto, 700×32)
- [x] Cycling Speed and Cadence (0x1816): velocidad de rueda y cadencia a partir de revoluciones acumuladas
- [x] Pantalla de emparejamiento con estado de cada sensor
- [x] Reconexión automática y aviso si se pierde un sensor durante la sesión
- [x] Player: pulso en directo con estado "en zona / por encima / por debajo"
- [x] Resumen con tiempo en zona medido por pulsómetro

Hecho cuando: con la banda y el sensor de velocidad conectados al ordenador veo pulso, velocidad y cadencia en directo.

Pendiente: prueba con hardware real (banda de pulso y sensor de velocidad), cuando lo tenga. Hasta entonces, la fase está comprobada con los sensores simulados.

## Fase 4 — Potencia estimada y métricas

Objetivo: vatios estimados en rodillo tonto y métricas de potencia.

- [x] `domain/trainer`: curvas velocidad→potencia de varios modelos de rodillo, seleccionable en ajustes
- [x] `domain/physics`: velocidad virtual según potencia, pendiente y peso (con tests)
- [x] `domain/metrics`: NP, IF, TSS, kJ (con tests)
- [x] Ramp test guiado que calcula FTP estimado y zonas de potencia
- [x] Bloques de workout con objetivo por pulso **o** por potencia
- [x] Todas las cifras estimadas marcadas como "estimado"

Hecho cuando: hago un ramp test, obtengo un FTP estimado y las sesiones muestran vatios objetivo.

Pendiente: prueba con el rodillo real (elegir su modelo o meter su curva), cuando lo tenga. Hasta entonces, la fase está comprobada con los sensores simulados.

## Fase 5 — Rutas 2D

Objetivo: rodar sobre una ruta con pendiente, al estilo de la vista de carrera.

- [x] `domain/route`: importar GPX, remuestrear cada 10 m, suavizar la pendiente (con tests)
- [x] 2–3 rutas de ejemplo propias (inventadas o de mis salidas, nunca de Zwift)
- [x] Vista de carrera: HUD con potencia, pulso, cadencia, velocidad, distancia, desnivel, tiempo y pendiente
- [x] Perfil de altimetría con posición actual y minimapa de la ruta
- [x] Modo libre: la velocidad virtual sale de la potencia y la pendiente de la ruta
- [x] Modo workout sobre ruta

Hecho cuando: hago una ruta entera viendo cómo avanzo y cómo cambia la pendiente.

Pendiente: probarlo con sensores reales cuando tenga el hardware. Hasta entonces, la fase está comprobada con los sensores simulados.

## Fase 6 — Grabación y exportación

- [x] Grabación a 1 Hz de todas las métricas disponibles
- [x] Recuperar una sesión si se cierra la pestaña por error
- [x] Exportar a TCX para subir a Strava o Garmin Connect
- [x] Detalle de cada salida en el historial con gráficas de pulso, potencia y velocidad
- [x] Importar y exportar workouts en formato `.zwo`

## Fase 7 — Mundo 3D

- [x] Carretera 3D generada a partir de la altimetría de la ruta
- [x] Avatar ciclista sencillo y cámara que lo sigue
- [x] Escenario procedural (terreno, árboles, cielo) con buen rendimiento en portátil
- [x] HUD de la Fase 5 superpuesto sobre la vista 3D

## Fase 8 — Rodillo inteligente (opcional)

Solo si compro uno.

- [ ] FTMS (0x1826): lectura de potencia, cadencia y velocidad reales
- [ ] Modo ERG: el workout fija la potencia del rodillo
- [ ] Modo simulación: la pendiente de la ruta ajusta la resistencia

## Mejoras fuera de fase (2026-11-26/27)

Hechas tras la Fase 7, a petición del usuario, antes de reordenar el roadmap. Detalle en `docs/contexto/fases/mejoras-entrenamiento.md` y `docs/contexto/decisiones/`.

- [x] Realismo 3D, ronda 1: sombras, texturas de asfalto y hierba, cielo con sol y nubes, líneas laterales y balizas
- [x] Realismo 3D, ronda 2: horizonte con montañas, vegetación a lo largo de la carretera, ciclista detallado que se inclina en las curvas y cámara que acompaña
- [x] Realismo 3D, ronda 3: público animando, quitamiedos, rodadas, arcén de grava y hora del día
- [x] Forma y fatiga (condición, fatiga y frescura en Historial)
- [x] Fantasma de tu mejor salida en la misma ruta
- [x] Avisos de voz: pulso fuera de zona, mitad y último minuto, subidas y resumen
- [x] Plan del entrenador: informe para el agente y plan semanal importable
- [x] Imagen Docker y `docs/ESTRUCTURA.md`
- [x] Pantalla completa (botón y tecla F)

## Fase 9 — Mantenimiento

El número de la antigua Fase 9 (móvil, descartada) queda libre y se reutiliza. Tareas en `docs/contexto/pendientes/PENDIENTES.md`.

- [x] Zonas de pulso Z1…Z6 en lugar de L1…VO2, con migración de los datos guardados (T1)
- [ ] Documentos de seguimiento al día (T2)
- [x] Curvas suaves en la vista 3D (T12)
- [ ] README corto y `docs/MANUAL.md` con el uso de toda la app (T11)

## Fase 10 — Paisaje real · nivel 1 (relieve y satélite)

Al importar un GPX, el paisaje 3D es el de verdad: relieve real y foto de satélite. Opcional por ruta (pide a servicios externos las imágenes de la zona) y guardado para usarlo sin conexión.

- [ ] Matemática de teselas y decodificación del relieve (lógica pura con tests)
- [ ] Descarga y caché de teselas con progreso, opt-in por ruta
- [ ] Terreno con el relieve real (cerca y horizonte), ajustado a la carretera del GPX
- [ ] Foto de satélite sobre el terreno
- [ ] Interfaz: activar el paisaje real en cada ruta GPX, atribución y aviso de privacidad

## Fase 11 — Paisaje real · nivel 2 (OpenStreetMap)

- [ ] Datos de OpenStreetMap de la zona (edificios, bosques, agua, carreteras) con caché
- [ ] Edificios en 3D con altura aproximada
- [ ] Árboles solo donde hay bosque real; agua y carreteras de alrededor

## Fase 12 — Paisaje real · nivel 3 (Google 3D, opcional)

Solo si creo una clave de Google Maps Platform.

- [ ] Clave en Ajustes (solo en el navegador) y Photorealistic 3D Tiles en lugar del terreno propio

## Fase 13 — GitHub profesional

Tarea T7 de `docs/contexto/pendientes/PENDIENTES.md`. Antes de empezar, el usuario decide entre repo público (todo gratis) o privado (las reglas de rama necesitan Pro o Team).

- [ ] Presentación: descripción, temas, web e imagen para compartir; `README` con insignias, capturas y arranque rápido
- [ ] Archivos estándar: `LICENSE` (la elige el usuario), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md` y `CHANGELOG.md`
- [ ] `.github/`: plantillas de issue en formulario y de PR, `CODEOWNERS`, `dependabot.yml` y etiquetas `tipo:`, `área:` y `prioridad:`
- [ ] Reglas de `main`: solo por PR con CI obligatorio, historial lineal sin `--force`, fusión _squash_ y borrado automático de ramas
- [ ] Commitlint en CI, release-please (versiones, etiquetas y `CHANGELOG`) e imagen en GHCR por versión
- [ ] Tablero de GitHub Projects junto a los milestones
- [ ] Seguridad del repo: escaneo de secretos con bloqueo, alertas de Dependabot y CodeQL, informe privado de vulnerabilidades y OpenSSF Scorecard
- [ ] Opcional: organización gratuita con el nombre de la «empresa» y transferir el repo

## Fase 14 — Docker de producción y seguridad

Tarea T4. La CSP se pone aquí, antes de la Fase 10, que solo abrirá los servicios de teselas que necesite.

- [ ] nginx sin root y con sistema de archivos de solo lectura; `cap_drop` y `no-new-privileges`
- [ ] Cabeceras de seguridad con CSP, repetidas en cada `location`
- [ ] Imágenes fijadas por digest
- [ ] Trivy, `npm audit` y CodeQL en CI; Dependabot
- [ ] SBOM y firma de la imagen
- [ ] Perfil `prod` con Caddy y HTTPS
- [ ] Release a GHCR
- [ ] `docs/despliegue/` y `SECURITY.md`

## Fase 15a — Mejoras aceptadas (antes del paisaje real)

- [ ] Selector de calidad gráfica del 3D
- [ ] Panel de inicio
- [ ] Strava sin API: descargar el archivo al guardar y botón «Abrir Strava para subir» (T8, opción b)
- [ ] Arco de meta y cámara de llegada (T16)
- [ ] Pulso máximo de la sesión con aviso inmediato (T17)
- [ ] Reconexión de Bluetooth sin preguntar, si Chrome lo permite (T18)
- [ ] Transiciones entre bloques, cuenta atrás grande en los últimos 5 s y gráfica de zonas tipo donut en el resumen

## Fase 15b — Mejoras aceptadas (después del paisaje real)

- [ ] Exportar FIT junto al TCX (para el entrenador)
- [ ] Zonas desde un test guiado y sugerencias de zonas con sensaciones al terminar (T20)

## Tareas sueltas en el orden de ejecución

- [ ] T14 · Crear una ruta eligiendo puntos en un mapa (justo después de la Fase 10)
- [ ] T13 · Ciclista realista: modelo 3D propio o con licencia libre (después de la Fase 12)
- [ ] T19 · Seguridad complementaria: copia cifrada, recordatorio de copia, límites al importar y señuelos (lo último de todo)

## En espera o en estudio (sin número)

- **Fase 8** (arriba): rodillo inteligente, cuando se compre uno con FTMS (T5); el casero queda descartado salvo como proyecto (T9).
- **Base de datos centralizada** (T8): Supabase si se decide; cambia la regla «sin backend».
- **AWS** (T6): solo si se decide.
- **Modo local con repo privado** (T3): depende de la Fase 13.
