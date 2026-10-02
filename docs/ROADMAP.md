# Roadmap — Rodillo Virtual

Una fase a la vez. Cada fase termina con la app funcionando, desplegada y con los tests en verde.
Marca `[x]` al completar cada tarea.

Los criterios de «hecho» se comprueban en el **ordenador (Chrome en Windows)**, con la web publicada. Las pruebas en móvil van aparte, en la Fase 9.

**Fase actual: 4**

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
- [ ] Bloques de workout con objetivo por pulso **o** por potencia
- [ ] Todas las cifras estimadas marcadas como "estimado"

Hecho cuando: hago un ramp test, obtengo un FTP estimado y las sesiones muestran vatios objetivo.

## Fase 5 — Rutas 2D

Objetivo: rodar sobre una ruta con pendiente, al estilo de la vista de carrera.

- [ ] `domain/route`: importar GPX, remuestrear cada 10 m, suavizar la pendiente (con tests)
- [ ] 2–3 rutas de ejemplo propias (inventadas o de mis salidas, nunca de Zwift)
- [ ] Vista de carrera: HUD con potencia, pulso, cadencia, velocidad, distancia, desnivel, tiempo y pendiente
- [ ] Perfil de altimetría con posición actual y minimapa de la ruta
- [ ] Modo libre: la velocidad virtual sale de la potencia y la pendiente de la ruta
- [ ] Modo workout sobre ruta

Hecho cuando: hago una ruta entera viendo cómo avanzo y cómo cambia la pendiente.

## Fase 6 — Grabación y exportación

- [ ] Grabación a 1 Hz de todas las métricas disponibles
- [ ] Recuperar una sesión si se cierra la pestaña por error
- [ ] Exportar a TCX para subir a Strava o Garmin Connect
- [ ] Detalle de cada salida en el historial con gráficas de pulso, potencia y velocidad
- [ ] Importar y exportar workouts en formato `.zwo`

## Fase 7 — Mundo 3D

- [ ] Carretera 3D generada a partir de la altimetría de la ruta
- [ ] Avatar ciclista sencillo y cámara que lo sigue
- [ ] Escenario procedural (terreno, árboles, cielo) con buen rendimiento en portátil
- [ ] HUD de la Fase 5 superpuesto sobre la vista 3D

## Fase 8 — Rodillo inteligente (opcional)

Solo si compro uno.

- [ ] FTMS (0x1826): lectura de potencia, cadencia y velocidad reales
- [ ] Modo ERG: el workout fija la potencia del rodillo
- [ ] Modo simulación: la pendiente de la ruta ajusta la resistencia

## Fase 9 — Pruebas en móvil (extra, al final)

Objetivo: usar la app en el móvil (Android). Hasta esta fase, el móvil no cuenta para dar ninguna fase por hecha. iPhone queda fuera: Safari no tiene Web Bluetooth.

- [ ] Instalar la PWA desde Chrome en Android y usarla en modo avión
- [ ] Sesión completa en el móvil: pitidos, voz y pantalla siempre encendida (Wake Lock)
- [ ] Sensores Bluetooth conectados al móvil
- [ ] Ajustes de interfaz para pantalla pequeña que salgan de las pruebas
- [ ] Almacenamiento persistente concedido con la app instalada

Hecho cuando: hago una sesión completa con sensores en el móvil, con la app instalada y en modo avión.
