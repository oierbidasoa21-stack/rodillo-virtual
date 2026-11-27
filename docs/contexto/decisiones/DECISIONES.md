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
- **Usuario · Personas en los bordes animando.** Público colocado como en las carreras de verdad: mucho en subidas (>3 %), curvas y los 200 m de salida y llegada, poco en llanos, en grupos de 1 a 4 en el arcén y mirando a la carretera. Se animan solo los que están a menos de 250 m y saltan cuando el ciclista pasa a menos de 45 m. Instanciados (5 mallas para todo el público). Son decorado: no son datos ni otros ciclistas.
- **Técnica · Quitamiedos** en el exterior de curvas de radio < 90 m; **rodadas** en el asfalto (textura que abarca el ancho de la carretera); **arcén de grava** con textura propia.
- **Técnica · Hora del día** (mañana, mediodía, atardecer) en un selector de la vista 3D; no se guarda. Las etiquetas viven en `ui/world/timeOfDay.ts`, sin Three.js, para no meterlo en el paquete principal.

## 2026-11-26 — Mejoras de entrenamiento

- **Usuario · Elige forma y fatiga, fantasma y avisos de voz**, y propone conectar la app con el agente que le plantea los entrenamientos.
- **Técnica · Condición/fatiga/frescura** con el modelo clásico de carga crónica (42 d) y aguda (7 d) sobre la carga por pulso que ya se guardaba. Sus bandas de lectura se doblan respecto a las de TSS porque una hora en L2 da 120 de carga (≈ 2× TSS). Nombres en español sin marcas registradas.
- **Técnica · Fantasma desde la grabación** de la salida más rápida (velocidad media) de al menos 1 km en la misma ruta, sin sensores simulados: no inventa nada. Se dibuja translúcido 1,3 m a la izquierda; la diferencia va en una etiqueta y no en el HUD (la rejilla de 5×2 casillas está llena).
- **Técnica · Avisos de voz** con pausas para no agobiar: el pulso se juzga tras 60 s del bloque, avisa tras 25 s fuera y no repite antes de 90 s; en recuperación nunca pide apretar. Las subidas (≥ 2,5 % en 100 m, ≥ 300 m y 15 m) se detectan de la ruta.
- **Técnica · Puente con el agente sin servidor**: informe Markdown con JSON para copiar y plan en JSON (`rodillo-virtual/plan@1`, claves en español) para pegar. La app extrae el JSON de la respuesta aunque venga con texto. Planes en Dexie v5 (con migración y test) y en la copia de seguridad (formato 4).
- **Técnica · Pruebas en navegador**: patchright evalúa en un contexto aislado; para interceptar la voz el script inyecta una etiqueta `<script>` y deja lo dicho en un atributo del DOM.

## 2026-11-27 — Docker y estructura

- **Usuario · Docker «para que otra gente pueda usarlo»** y un documento que explique cada carpeta y archivo.
- **Técnica · Imagen estática multietapa** (Node 24 compila, nginx 1.27 sirve): unos 80 MB y sin Node en ejecución. La ruta base pasa a ser configurable (`BASE_PATH`, `/` en Docker y `/rodillo-virtual/` en Pages). CI construye la imagen en cada push para que no se rompa.
- **Técnica · Sin datos personales en la imagen**: `.dockerignore` excluye `config/*.local.json`, `data/` y `.git`; el build solo importa `athlete.example.json`.
- **Producto · La web publicada sigue siendo la vía recomendada** para otras personas (sin instalar, datos en su navegador). Docker añade autoalojamiento; fuera de `localhost` necesita HTTPS para Bluetooth y PWA (documentado, sin incluir proxy).
- **Limpieza · `demo3d.png`** se había subido por error (captura por defecto de un script de prueba): borrada, el script guarda en la carpeta temporal y `.gitignore` ignora `/*.png`.
- **Usuario · Pantalla completa.** Con la API Fullscreen sobre toda la capa de la sesión (no solo el lienzo 3D), para que el HUD, el perfil y los botones sigan a mano; botón y tecla F en la ruta y en el reproductor; al cerrar la sesión se sale sola.

## 2026-11-27 — Tareas apuntadas, no hechas

- **Usuario · Los cambios los hace su propio agente.** Claude solo apunta las tareas (`pendientes/PENDIENTES.md`, T0–T6) y no toca el código. Un primer intento del cambio de zonas se deshizo sin subirlo.
- **Usuario · Zonas de pulso Z1…Z6** en lugar de L1, L2, L3, UA, UA+ y VO2. Pendiente de hacer (T1), con migración Dexie v6 y aceptando los nombres viejos al importar.
- **Usuario · Quiere poder hacer el repo privado sin GitHub Pro.** Opción recomendada: Docker en local (`localhost:8080`); Pages solo publica repos públicos en el plan gratuito. Pendiente (T3); la visibilidad la cambia él.
- **Técnica · Licencia de la imagen de satélite (Fase 10):** Sentinel-2 cloudless de EOX es CC BY-NC-SA, no comercial. Vale para uso personal; si la app se vendiera, habría que cambiar de fuente.
- **Usuario · Reparto del trabajo.** Habla solo con Claude en la nube, que hace de intermediario: apunta las tareas (`pendientes/`, issues), revisa los PR y mantiene `docs/contexto/`. El agente de VS Code hace los cambios. Se comunican por el repo. Claude en la nube solo toca `docs/contexto/` y los issues, para no pisarse.
- **Usuario · Acepta las ideas del estudio salvo el modo daltónico** (no le interesa por ahora).
- **Usuario · Quiere el GitHub «como el de una empresa»** (T7) y **pregunta por una base de datos centralizada** (T8) y por un **rodillo inteligente casero** (T9). Pendiente de que decida: público o privado (las reglas de rama en privado necesitan Pro o Team), qué opción de base de datos y el modelo de su rodillo tonto.
- **Usuario · Todavía no tiene rodillo.** Su idea era ahorrar montando uno casero; con el coste total, la recomendación es un FTMS de segunda mano (T9).
- **Usuario · Repo privado: apuntado, todavía no** (T3, con lo que se rompería: sobre todo Pages).
- **Usuario · Issues de GitHub: más adelante** (T10).
- **Técnica · Supabase no exige backend propio** (API generada, login, RLS; Edge Functions solo para secretos como Strava). Sigue en estudio (T8).
- **Usuario · Orden de ejecución confirmado:** 9 → 13 → 14 → 15a → 10 → 11 → 12, la 15b después y la 8 cuando haya rodillo. Los números de fase no cambian.
- **Usuario · Supabase como proveedor** para Strava (Edge Function y tokens con RLS) y, si se centralizan los datos, para la base de datos. Claude está de acuerdo: un solo proveedor para login, base de datos y funciones. Para solo Strava, Cloudflare Workers sería algo más ligero, pero obligaría a tener otro proveedor más.
- **Usuario · Rodillo:** si el casero se complica y comprar sale más rentable, se compra. Con los números, la vía es **comprar un FTMS de segunda mano**.
- **Usuario · Strava: subida automática al guardar** la sesión (cola y reintento si falla, desactivable). ~~Sin Strava de pago~~. **Corrección:** la API de Strava ahora es solo para suscriptores (comprobado por el usuario). Pendiente: (a) pagar y subida automática, o (b) descargar el FIT al guardar y subirlo a mano con un botón que abre Strava.
- **Usuario · Strava, opción (b):** sin API (de pago) y sin Supabase. Al guardar, la app descarga el FIT (TCX mientras tanto) y ofrece un botón que abre la página de subida manual de Strava. Va a la Fase 15a. Pasar por iGPSPORT se descarta: no hay API pública y no ahorra pasos.
- **Usuario · Documentación de uso:** README corto como portada y un `docs/MANUAL.md` nuevo con cómo funciona toda la app (T11). Va en la Fase 9, y el manual se actualiza en cada fase que cambie algo visible.

## 2026-11-28 — Más pedidos del usuario

- **Usuario · Nuevas tareas apuntadas** (T12–T20): curvas suaves (fallo, Fase 9), ciclista realista, crear ruta en un mapa (después de la 10), clave de Google para el nivel 3 (en la 12), arco de llegada, pulso máximo, reconexión de Bluetooth, sugerencias de zonas y sensaciones.
- **Usuario · Seguridad complementaria al final de todo** (T19). La CSP sigue en la Fase 14.
- **Técnica · Los niveles de paisaje real no mejoran el ciclista.** El ciclista realista es una tarea aparte (T13).
- **Usuario · Prueba de hardware:** PWA instalada y botón de actualizar visto; el player cabe sin scroll en su pantalla.
- **Estado · PR #31 fusionado** (lo hizo el agente de VS Code).
- **Usuario · «Context bombs» = las dos cosas:** CSP en la Fase 14 y trampas que avisan (_canary tokens_) en T19, sobre todo una vez exista Supabase.
- **Usuario · Curvas suaves antes que el realismo** (T12 en la Fase 9).
- **Usuario · Datos centralizados en Supabase** (T8, opción C). Ubicación propuesta: fase propia después de la 15b; pendiente de confirmar.

## 2026-11-28 — Fase 9 · zonas Z1…Z6 (T1)

- **Usuario · Zonas Z1…Z6** en lugar de L1, L2, L3, UA, UA+, VO2 (misma posición, mismos pesos y MET).
- **Técnica · Migración en Dexie v6** con una función pura (`domain/zones/legacy.ts`) que recorre el valor guardado y solo renombra campos de zona (`zoneId`, `targetZoneId`, segundos por zona y zonas del atleta). No toca `routes` ni `recordings` ni texto libre: una ruta o una nota pueden contener «UA».
- **Técnica · Los nombres viejos se siguen aceptando al importar** (copia, archivo de atleta, plan del agente, `.zwo`) para no perder datos ni planes antiguos. `isZoneId` sigue estricto y `toZoneId` es el que acepta los dos.
- **Técnica · Etiquetas:** la de ejemplo se renombra (`UA (umbral)` → `Z4 (umbral)`); la que escribió el usuario se respeta.
- **Producto · Pulso frente a potencia:** las zonas de potencia también se llaman Z1…Z7 y no coinciden. Donde salen las dos se dice «de pulso» o «de potencia» («Potencia Z4 · Umbral» en el player).
- **Proceso · El PR de T1 no se fusiona sin revisión** de Claude en la nube (pedido del usuario). Los PR solo de documentación (#31, #32) sí los fusiona el agente con CI en verde.
- **Organización · Reparto ajustado:** el agente de VS Code actualiza `estado/`, `registro/`, `fases/` y `sesiones/` al cerrar sus tareas (regla 7 de `CLAUDE.md`); Claude en la nube escribe tareas, decisiones, estudios, la página de seguimiento y las revisiones. Claude en la nube agrupa sus commits y trae `main` antes de subir. Motivo: el merge del PR #32 se rechazó dos veces por commits simultáneos.
- **Usuario · Orden completo** puesto en el roadmap por el agente (PR #32): 9 → 13 → 14 → 15a → 10 → T14 → 11 → 12 → 15b → T13 → T19. Es el correcto.

## 2026-11-28 — Agentes en la nube en lugar del de VS Code

- **Usuario · No quiere hacer de intermediario: solo revisar.** Desde T11, los cambios los hace un **agente en la nube** que lanza y coordina Claude en la nube (session_014GP28MJLJsnAVBtMEof8Ed), por mensajes entre sesiones y por el repo. El agente de VS Code deja de recibir tareas. El usuario sigue el avance en la página de seguimiento y prueba en la web publicada.
- **Organización · PR de solo documentación:** con CI en verde los puede fusionar el coordinador tras revisarlos (regla nueva de `CLAUDE.md`, PR #36). Los de código también los fusiona el coordinador tras su revisión.
- **Usuario · Trabajo continuo sin pararse.** El coordinador encadena las tareas en el orden de ejecución: revisa, fusiona y asigna la siguiente sin preguntar. Al usuario le manda un resumen corto por tarea cerrada. Solo le pregunta lo que únicamente él puede decidir, y mientras tanto el agente sigue con otras tareas. El usuario puede parar en cualquier momento escribiendo «para».
- **Usuario · Repo público, se descarta pasarlo a privado** (T3 descartada): no compensa el lío. Ventajas: sigue GitHub Pages y la Fase 13 es gratis. Los datos personales siguen fuera del repo.
- **Usuario · «Datos en Supabase» después de la 15b** (le gusta la propuesta). Orden: 9 → 13 → 14 → 15a → 10 → T14 → 11 → 12 → 15b → Datos en Supabase → T13 → T19.
- **Usuario · Licencia: todos los derechos reservados.** Dijo «si es mucho jaleo, MIT; si no, derechos reservados». Ninguna da trabajo, así que se queda con derechos reservados: el código se ve, pero no se puede reutilizar sin permiso.
- **Usuario · Comprará un rodillo FTMS** (la Fase 8 espera a que lo tenga).
- **Usuario · Issues: decide Claude.** Creados el 2026-11-28: #37 (T11) y #38–#66 para las casillas pendientes. Como desde la nube no se pueden crear milestones, van con etiquetas `fase-9`, `fase-13`, `fase-14`, `fase-15a`, `fase-15b`, `datos-supabase` y `tareas-sueltas`. Los milestones los creará un workflow en la Fase 13 (#43). T10 hecha así.
- **Usuario · Los pasos en Settings de GitHub** (`pendientes/pasos-usuario-fase-13.md`: ruleset de `main`, permisos de Actions, seguridad, tablero, presentación) **se hacen después de la Fase 12.** Mientras tanto: release-please no debe dejar `main` en rojo, los issues que dependen de esos ajustes quedan abiertos y la Fase 13 se cierra con eso pendiente. El coordinador sigue revisando cada PR antes de fusionar.

## 2026-11-28 — Fase 13 · GitHub profesional (decisiones técnicas)

- **Técnica · Commitlint como dependencia de desarrollo** (`@commitlint/cli` y `@commitlint/config-conventional`): es el comprobador estándar y mantenido de Conventional Commits. Revisa cada commit del PR y también el título, porque con _squash_ el título es el commit de `main`. `subject-case` desactivado (los asuntos llevan Z1, PR #36, T11) y las líneas largas del cuerpo solo avisan (pueden llevar URLs).
- **Técnica · Versiones con release-please desde la 0.9.0**: la Fase 9 cerrada marca el número; antes de la 1.0 un `feat` sube la versión menor. Solo lee commits posteriores al `main` del cierre de la Fase 9 (`bootstrap-sha`), así que no reescribe el historial. Changelog en español (funciones nuevas, errores corregidos, rendimiento y documentación).
- **Técnica · release-please con `continue-on-error`** hasta que el usuario permita a Actions abrir PR (tras la Fase 12). Usa el secreto `RELEASE_PLEASE_TOKEN` si existe, porque los PR abiertos con `GITHUB_TOKEN` no lanzan CI y, con el _ruleset_, no se podrían fusionar.
- **Técnica · Milestones con un workflow** (`.github/milestones.json`): desde la nube no se pueden crear. Busca por título exacto, nunca borra ni reabre, y coloca cada issue nuevo según su etiqueta `fase-*`.
- **Técnica · Etiquetas en `.github/labels.json`** con un workflow que crea o actualiza y nunca borra, para no perder las `fase-*`.
- **Técnica · CodeQL con workflow propio** (JS/TS y los workflows, consultas `security-and-quality`) en lugar del «default setup», para controlar cuándo corre y que el job se llame `CodeQL` en el _ruleset_.
- **Técnica · La imagen en GHCR por versión pasa a la Fase 14** (#52), junto a la firma y el SBOM (#50).
- **Técnica · Imagen para compartir en JPG** (117 KB frente a 774 KB en PNG); GitHub acepta los dos.
- **Proceso · Contexto en un PR de cierre de fase**: los PR de una fase se revisan en paralelo y, si todos tocaran `estado/`, `registro/` y `sesiones/`, chocarían al fusionarlos. Acordado con el coordinador, que solo toca `PENDIENTES.md` (decisiones del usuario), `decisiones/` (al final), `estudios/` y `seguimiento.html`.
