# Fase 7 — Mundo 3D ⏳ (en curso)

**Empezada:** 2026-11-25 · **Rama:** `feat/world-3d` · **Milestone:** Fase 7 (issues #6–#9)

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
