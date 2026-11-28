# Fase 15a — Mejoras aceptadas (antes del paisaje real)

Issues #54–#60 (etiqueta `fase-15a`). Son las mejoras que el usuario aceptó del punto 5 del [estudio del 2026-11-27](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md) y de `pendientes/PENDIENTES.md` (T8 opción b, T16, T17 y T18), antes de empezar con el paisaje real (Fase 10).

## Plan

Un PR por issue, **cada uno desde `main` actualizado y sin encadenar** (lección de la Fase 14). Si uno necesita algo de otro, espera a que el otro esté fusionado. Orden, de lo más acotado a lo más grande:

| Orden | Issue | Qué                                                                                      | Notas                                                                                                                                |
| ----- | ----- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | #54   | Selector de calidad gráfica del 3D (baja, media y alta)                                  | Ajuste guardado; sombras, densidad de vegetación y público, distancia de dibujo                                                      |
| 2     | #58   | Pulso máximo de la sesión y del bloque, con aviso inmediato (T17)                        | Cambia el modelo de sesión: migración de Dexie con test, copia de seguridad y `.zwo`                                                 |
| 3     | #56   | Strava sin API: descarga del archivo al guardar y botón «Abrir Strava para subir» (T8 b) | TCX hasta que exista FIT (15b); nada para sesiones simuladas; interruptor en Ajustes                                                 |
| 4     | #59   | Reconexión de Bluetooth sin preguntar (T18)                                              | `getDevices()` y `watchAdvertisements()` si Chrome los ofrece; si no, como ahora. No se puede probar en headless: solo con simulados |
| 5     | #60   | Transiciones entre bloques, cuenta atrás grande, gráfica donut y fantasma más visible    | Puede ir en dos PR si crece                                                                                                          |
| 6     | #57   | Arco de meta y cámara de llegada (T16)                                                   | Objeto propio sobre la carretera del GPX, para que siga valiendo con los niveles 2 y 3                                               |
| 7     | #55   | Panel de inicio: semana, forma y fatiga, próxima sesión                                  | Reutiliza los cálculos de forma y el plan del entrenador                                                                             |

## Criterios

- Cada PR con lint, tests y build en verde; la lógica nueva en `src/domain/` con tests (con un caso calculado a mano cuando sea una fórmula).
- La app nunca inventa datos: lo que dependa de un sensor no se muestra sin él.
- Comprobado en el navegador con sensores simulados. La CSP de la Fase 14 sigue sin violaciones (`pruebas/scripts/fase14-csp.mjs`).
- **Manual y capturas al día** (regla 10 de `CLAUDE.md`) en el mismo PR de cada mejora visible.
- Contexto (`estado/`, `registro/`, `sesiones/`, este archivo y las líneas de `PENDIENTES.md`) en un **PR de cierre de fase**.

## Hecho

_(se completa en el PR de cierre de la fase)_
