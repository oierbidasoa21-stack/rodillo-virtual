# Fase 7 — Mundo 3D ✅

**Fechas:** 2026-11-25 · **Rama:** `feat/world-3d` · **Milestone:** Fase 7 (cerrado, issues #6–#9)

## Objetivo

Rodar las rutas en una vista 3D: la carretera sale de la altimetría de la ruta, un ciclista sencillo con cámara que lo sigue, escenario procedural (terreno, árboles, cielo) fluido en un portátil y el HUD de la Fase 5 encima. El usuario pidió además una **demo** para ver cómo queda sin hardware.

## Plan (trabajo en automático, sin aprobación)

1. **Dependencias**: `three` y `@react-three/fiber` (el stack de `CLAUDE.md`). Sin `drei`: lo poco que hace falta (cámara, cielo, instancias) se escribe a mano y la app pesa menos. El 3D se carga aparte (`React.lazy`), así la app no tarda más en abrir y el service worker lo guarda para usarlo sin conexión.
2. **`src/domain/world/`** (puro, con tests, sin Three.js):
   - Proyección de la ruta (lat/lon/altitud) a metros locales x/y/z alrededor de su centro.
   - Eje de la carretera con dirección suavizada; cinta de la carretera (bordes a ±3 m) y arcenes.
   - Terreno: altura procedural (ruido determinista) que se funde con la carretera cerca de ella, para que la carretera nunca quede enterrada ni flotando.
   - Árboles: posiciones con un generador pseudoaleatorio con semilla, fuera de la carretera y sus arcenes.
   - Pose del ciclista y de la cámara a una distancia dada (detrás y por encima, mirando hacia delante), con vueltas.
3. **`src/ui/world/`**: lienzo 3D con carretera, terreno (malla de baja resolución con sombreado plano), árboles con `InstancedMesh`, cielo con degradado, niebla y luz; ciclista hecho de piezas simples que pedalea con la cadencia y gira las ruedas con la velocidad; cámara que lo sigue con suavizado.
4. **Vista de carrera**: «Vista 3D» por defecto (si el navegador tiene WebGL) con el HUD encima y el perfil y el minimapa debajo; botón para volver a la vista 2D. Sin WebGL, se queda en 2D y lo dice.
5. **Rendimiento**: resolución de píxel limitada, árboles instanciados con un tope, terreno con pocos vértices, sin sombras dinámicas. Se mide en headless.
6. **Demo** («Ver demo 3D» en Rutas): recorre una ruta de ejemplo con 200 W **simulados** y la física de siempre, sin sensores. Va marcada como **DEMO** en todo momento y no se guarda ni se graba nada.

### Cierre

7. README, contexto, roadmap, cerrar issues #6–#9 y el milestone, push, CI y Deploy, y prueba contra la web publicada.

## Decisiones de esta fase

- La geometría vive en `src/domain/world/` (nueva carpeta de dominio): es cálculo puro y se testea en Node; la UI solo la convierte en mallas de Three.js.
- La demo es un modo dentro de la propia app (no un artefacto ni una web aparte), marcada como DEMO y sin guardar nada, para no mezclar datos inventados con los reales.
- **Suelo sin acantilados:** cerca de la carretera el suelo sigue su altura (ponderada por distancia, con una caída suave a cero a 200 m); lejos, sigue un campo de alturas grueso (celdas de 100 m) rellenado desde la carretera y suavizado. La primera versión volvía a la altura media de la ruta más allá de 200 m y dejaba paredes de 200 m en el puerto; se vio en la captura y se corrigió con un test que lo impide.
- **Línea discontinua por distancia** (trazo de 4 m cada 12 m), interpolada sobre la ruta: con los puntos cada 10 m salía continua.
- **3D solo en «Rodar»** (y en la demo). La sesión sobre ruta sigue con la franja 2D bajo el player, que ya va justa de espacio en 1280×900.

## Qué se hizo

- **`src/domain/world/`** (12 tests): `path.ts` (proyección, posición por distancia con vueltas, pose y cámara), `road.ts` (cinta de carretera y línea discontinua), `terrain.ts` (ruido, índice de la carretera, campo lejano, altura del suelo, malla del terreno, árboles).
- **`src/ui/world/`**: `World3D` (lienzo, luces, niebla), `WorldTerrain`, `WorldRoad` (con arco de salida), `WorldTrees` (instancias), `WorldSky` (cúpula con degradado), `WorldRider` (ciclista con piernas que pedalean y cámara que lo sigue suavizada).
- **Vista de carrera**: 3D por defecto, HUD encima, perfil y minimapa debajo, botón «Vista 2D».
- **Demo 3D** en Rutas.
- Three.js en un trozo aparte (931 kB, 248 kB comprimido) que se carga al abrir la vista 3D y el service worker guarda.

## Comprobación

En navegador headless (con renderizado por software) a 1280×900, script `pruebas/scripts/fase7-demo-3d.mjs`:

- Demo en el Puerto y en el Rompepiernas: **60 fps**, HUD con 200 W demo, pendiente y velocidad que cuadran (6,3 % → 12 km/h), cambio a 2D y vuelta, y nada guardado (historial y sesión en curso vacíos).
- La salida de 4′ de la Fase 6 (ahora en 3D) sigue grabando y exportando igual.

## Pendiente

Ver la demo y una salida en 3D en tu portátil (los fps reales dependen de la gráfica).
