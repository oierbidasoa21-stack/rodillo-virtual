# Decisiones

Cada decisión con su fecha, quién la tomó (**usuario** o **técnica**, propuesta por Claude y aceptada) y el motivo. Las más recientes, al final.

## 2026-10-02 — Arranque y Fase 0

- **Usuario · Cuenta de GitHub `oierbidasoa21-stack`**, no `oierfernandezg`: es la cuenta con sesión en `gh`. Repo `rodillo-virtual`.
- **Usuario · Repo público**, para poder usar GitHub Pages gratis. Los datos personales que quedaron en la v1 de referencia y en el historial de git **se dejan así**, sin reescribir el historial.
- **Usuario · Peso y zonas fuera del repo**: en `config/athlete.local.json` (ignorado), con `config/athlete.example.json` como esquema.
- **Técnica · TypeScript fijado en `~6.0`**: typescript-eslint no admite TS 7.
- **Técnica · Un solo workflow de CI** y luego, a petición del usuario, **`Deploy` separado con `paths-ignore`** para `docs/**` y `*.md` (los cambios de documentación no redespliegan; el lint sigue corriendo en todo).

## 2026-10-02 — Fase 1

- **Usuario · Peso y zonas en la app**: valores de ejemplo por defecto; se editan en Ajustes o se **importa `athlete.json`**. Se guardan en IndexedDB.
- **Usuario · Fuentes Barlow autoalojadas** con `@fontsource` (sin Google Fonts).
- **Usuario · `fake-indexeddb`** para testear la capa de almacenamiento.
- **Técnica · Player como máquina de estados pura** que emite eventos; la UI y el audio solo reaccionan. El tiempo que sobra de un tick pasa al bloque siguiente.
- **Técnica · Al editar una zona se ajusta la vecina** para que no queden huecos.
- **Técnica · El contador de 10″ siempre pita**, aunque los pitidos estén apagados.

## 2026-10-02 — Fase 2 y cambio de enfoque

- **Usuario · Fase PWA insertada como Fase 2** y renumeración del resto.
- **Usuario · `vite-plugin-pwa`**.
- **Técnica · Actualizaciones en modo «aviso»**: nunca se recarga sola; el aviso espera si hay una sesión o el editor abierto.
- **Usuario · Probar solo en el ordenador (Chrome en Windows)**. El móvil pasa a una fase final aparte (Fase 9). Los criterios de «hecho» se comprueban en el ordenador.
- **Usuario · Fase 2 cerrada sin su prueba de instalación**: la hará más adelante.

## 2026-10-02/03 — Fase 3

- **Usuario · `@types/web-bluetooth`**.
- **Usuario · Circunferencia de rueda en la Fase 3**, por defecto **2155 mm (700×32)**. Bici: Van Rysel EDR AF.
- **Usuario · Sensores simulados también en la web publicada**, tras un interruptor en Ajustes → Desarrollo, siempre marcados como SIMULADO.
- **Usuario · Sin hardware todavía**: la fase se cierra con simulados y la prueba real queda pendiente.
- **Técnica · Los sensores simulados generan paquetes en bytes** que pasan por los mismos decodificadores que los reales.

## 2026-10-03 — Fase 4

- **Usuario · Curvas de rodillo**: lista de modelos con fuente verificable + curva personalizada. Por defecto ninguna (sin potencia).
- **Usuario · Objetivos de potencia en % del FTP** (banda ±5 %).
- **Usuario · Ramp test estándar**: 5′ a 100 W, +20 W/min, FTP = 75 % del mejor minuto.
- **Usuario · Una fase con 3 revisiones**.
- **Usuario · Copia de seguridad completa** (sesiones, historial, ajustes) antes de seguir.
- **Técnica · Solo rodillos de fluido** en la lista (coeficientes de GoldenCheetah); los magnéticos dependen del nivel de resistencia.
- **Técnica · `zoneId` → `target`** en los bloques, con migración Dexie v1 → v2.
- **Técnica · El simulador vuelve a su estado** al terminar una sesión.

## 2026-10-03 — Fase 5

- **Usuario · 3 rutas inventadas** en la app; los GPX propios se importan y no van al repo.
- **Usuario · Minimapa en SVG sin mapa de fondo** (funciona sin conexión).
- **Usuario · Sin potencia no se rueda en modo potencia**, pero **sí en un modo «por velocidad de rueda»**, siempre marcado como «sin potencia».
- **Usuario · En sesión sobre ruta, la ruta da vueltas** hasta que acaba la sesión.
- **Usuario · El modo activo siempre visible** en la vista de carrera.
- **Técnica · Altitud suavizada con media triangular de ±50 m** (una media simple dejaba bordes del 60 % con picos de GPS).

## 2026-11-25 — Organización

- **Usuario · Milestones en GitHub** para organizar el trabajo: uno por fase, más «Pruebas con hardware real». Las tareas pendientes como issues.
- **Usuario · Carpeta `docs/contexto/`** con todo el contexto, actualizada tarea a tarea.
- **Técnica · Artefacto de Claude como «app instalable»: no sirve como sustituto de la PWA.** El visor de artefactos bloquea las APIs de dispositivo (Web Bluetooth incluida), no permite service worker ni manifest propios y no deja hacer peticiones a otros sitios. Se puede fijar en la barra lateral de claude.ai, pero no instalar como app del sistema. La app instalable es la PWA de GitHub Pages.
- **Usuario · Sin artefacto**: no se hará demo como artefacto de Claude.
- **Usuario · Trabajo en automático**: Claude hace todo sin pedir aprobación: planes (escritos en `docs/contexto/fases/`), decisiones de diseño (anotadas aquí), dependencias nuevas (explicadas), commits, push y fast-forward a `main`. Solo pregunta lo que únicamente el usuario puede saber (equipo, compras).
- **Usuario · Solo ordenador**: no hay móvil en el proyecto. Se elimina la Fase 9 del roadmap y se cierran su milestone y sus issues como «no planificado».
- **Usuario · Se mantiene el formato `.zwo` en la Fase 6** tras explicarle qué es (archivo de sesiones estructuradas que usan muchas apps de rodillo).

## 2026-11-25 — Fase 6 (grabación y exportación)

- **Técnica · TCX en vez de FIT**: es texto, lo aceptan Strava, Garmin Connect e intervals.icu y se genera sin dependencias.
- **Técnica · La grabación vive en `src/recording/`**, código puro con tests, como pide `CLAUDE.md`.
- **Técnica · Retomar abre en pausa** y el tiempo con la app cerrada no cuenta; el TCX lleva el tiempo en movimiento.
- **Técnica · Potencia grabada siempre que haya curva de rodillo**, también en modo rueda.
- **Técnica · Gráficas en SVG propio**, una por dato con el mismo eje de tiempo y cruz compartida (nunca dos escalas en una gráfica). Sin librería, para no aumentar el peso de la app.
- **Técnica · `.zwo`**: rampas en escalones de 1′; bloques por pulso exportados como `FreeRide` con la zona en un mensaje, que esta app recupera al importar; `FreeRide` ajeno → pulso L2 y `MaxEffort` → pulso VO2, con aviso.

## 2026-11-25 — Fase 7 (mundo 3D)

- **Usuario · «Termina de completar todo» y una demo** de cómo se ve. La Fase 8 se deja para cuando diga si compra un rodillo inteligente (el roadmap la condiciona a eso).
- **Técnica · Dependencias `three` y `@react-three/fiber`** (las del plan de `CLAUDE.md`). Sin `@react-three/drei`: la cámara, el cielo y las instancias se escriben a mano en pocas líneas y así la app pesa menos.
- **Técnica · El 3D se carga aparte** (`React.lazy`): la app abre igual de rápido y el trozo 3D (931 kB) se descarga al abrir la vista y queda guardado para usarla sin conexión.
- **Técnica · Geometría en `src/domain/world/`**, pura y testeada en Node; la UI solo la convierte en mallas.
- **Técnica · Suelo con dos capas** (carretera cercana ponderada por distancia + campo lejano suavizado) para que no haya acantilados lejos de la carretera ni el suelo tape la carretera en las herraduras.
- **Técnica · Demo dentro de la app**, marcada como DEMO, a 200 W simulados y sin grabar ni guardar nada: enseña el 3D sin sensores sin mezclar datos inventados con los reales.
- **Técnica · Vista 3D por defecto al rodar** (si hay WebGL), con botón para volver a 2D. No se guarda la preferencia.

## 2026-11-26 — Más realismo en la vista 3D

- **Usuario · Pide que el 3D sea más realista.** Se mejora lo que más se nota sin bajar los fps: sombras, texturas, cielo, marcas viales y balizas.
- **Técnica · Texturas generadas en el navegador** (ruido, `ui/world/textures.ts`) en vez de imágenes: no pesan en la descarga ni tienen licencias.
- **Técnica · Sol con sombras que siguen a la cámara** (caja de 80 m, mapa de 2048 px ajustado a texel para que no tiemblen): sombras nítidas cerca sin coste grande.
- **Técnica · Balizas cada 50 m en los arcenes**: dan sensación de velocidad, como en las carreteras de montaña.
- **Usuario · «Lo más realista posible».** Segunda ronda:
  - **Horizonte**: el terreno se nivela en su borde y un anillo de tierra con montañas (prados, bosque, roca y nieve por altura) llega hasta 6 km; la niebla va de 250 a 6000 m para que se vean a lo lejos difuminadas.
  - **Vegetación a lo largo de la carretera** (320 árboles/km, matorrales y rocas) en vez de repartida por toda la caja de la ruta, que en rutas largas dejaba el paisaje vacío. Tres tipos de árbol, girados y teñidos al azar con semilla.
  - **Ciclista**: brazos, manillar, sillín, zapatillas y ruedas con llanta y radios. Se inclina en las curvas con tan(α) = v²/(g·R) y balancea al pedalear.
  - **Cámara**: acompaña un 30 % la inclinación y abre el campo de visión hasta 8° con la velocidad (sensación de velocidad).
