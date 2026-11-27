# Fase 9 — Mantenimiento

Primera fase del orden de ejecución acordado el 2026-11-27 (9 → 13 → 14 → 15a → 10 → T14 → 11 → 12 → 15b → T13 → T19). Reutiliza el número de la antigua Fase 9 (móvil, descartada). Las tareas y su diseño están en `pendientes/PENDIENTES.md`.

| Tarea | Qué                                         | Estado                           |
| ----- | ------------------------------------------- | -------------------------------- |
| T1    | Zonas de pulso Z1…Z6 con migración Dexie v6 | ✅ PR #33, revisado y fusionado  |
| T12   | Curvas suaves en la vista 3D                | 🔍 PR #35, abierto para revisión |
| T2    | Documentos de seguimiento al día            | Pendiente                        |
| T11   | README corto y `docs/MANUAL.md`             | Pendiente (al final de la fase)  |

## Forma de trabajar

Una rama y un PR por tarea, con lint, tests y build en verde. Los PR de código no se fusionan hasta que los revisa Claude en la nube. Al cerrar cada tarea, el agente de VS Code actualiza `estado/`, `registro/`, `fases/`, `sesiones/` y la línea de estado de su tarea en `pendientes/`.

## T12 · Curvas suaves (diseño aplicado)

- **Causa:** el camino 3D era la poligonal de la ruta (un punto cada 10 m), con el rumbo sacado de una ventana de ±5 m. El rumbo se quedaba quieto en cada tramo y saltaba en cada vértice.
- **Arreglo:**
  - `smoothPath` pasa un spline Catmull-Rom centrípeto por los puntos de la ruta y lo muestrea **cada metro**. La distancia `d` de cada muestra se interpola de la ruta, así que sigue siendo «metros de la ruta» y el ciclista 3D va al paso del HUD y de la grabación.
  - El rumbo sale de la tangente (ventana de ±1 m, igual al muestreo, para que siempre abarque dos tramos). La pendiente sigue con ±5 m, para que los baches de la altitud no lo balanceen.
  - El terreno sigue a la carretera con un punto cada 10 m del camino suavizado, para no multiplicar el coste ni que los vecinos pesen más que el punto bajo la carretera.
  - La cámara amortigua por separado la posición (2,5/s) y el punto al que mira (1,8/s, más lento); la inclinación del ciclista pasa de 4/s a 3/s.
- **Tras la revisión de Claude en la nube:**
  - con el camino cada metro, `Math.min(...lista)` / `Math.max(...lista)` desbordaban la pila en una ruta de 160 km (160 000 puntos). Ahora se usa `domain/extent.ts`, un bucle, en `path.ts` y `terrain.ts`, y también en `power.ts` y `tcx.ts` para las listas largas de muestras. Test: una ruta de 160 km construye todo el mundo 3D;
  - los bucles se cierran de forma explícita: «cerrada» significa extremos a menos de 30 m, no punto repetido, así que el tramo de cierre se dibuja con la misma curva, sin hueco ni quiebro. Las posiciones siguen saltando ese tramo en cada vuelta, como la vista 2D y la grabación;
  - se corrige el comentario de `rightAt` (±2 puntos son ahora ±2 m).
- **Test** (`domain/world/curves.test.ts`): en un arco de radio 100 m con puntos exactos cada 10 m, el rumbo gira 1/R = 0,01 rad por metro, dentro de ±5 % en cada metro; la poligonal antigua oscilaba entre 0 y 2/R. La curva queda a menos de 5 mm del círculo (las cuerdas se hunden 12,5 cm), salvo en los 10 m de cada extremo, donde no hay vecino real. A través de `projectRoute` (remuestreo de 10 m sobre cuerdas) queda dentro de ±40 %.
