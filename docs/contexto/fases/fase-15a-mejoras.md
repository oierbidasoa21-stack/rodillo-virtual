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
| 6     | #57   | ~~Arco de meta y cámara de llegada (T16)~~                                               | **Descartado** por el usuario el 2026-11-28 (issue cerrado como no planificado)                                                      |
| 7     | #55   | Panel de inicio: semana, forma y fatiga, próxima sesión                                  | Reutiliza los cálculos de forma y el plan del entrenador                                                                             |

## Criterios

- Cada PR con lint, tests y build en verde; la lógica nueva en `src/domain/` con tests (con un caso calculado a mano cuando sea una fórmula).
- La app nunca inventa datos: lo que dependa de un sensor no se muestra sin él.
- Comprobado en el navegador con sensores simulados. La CSP de la Fase 14 sigue sin violaciones (`pruebas/scripts/fase14-csp.mjs`).
- **Manual y capturas al día** (regla 10 de `CLAUDE.md`) en el mismo PR de cada mejora visible.
- Contexto (`estado/`, `registro/`, `sesiones/`, este archivo y las líneas de `PENDIENTES.md`) en un **PR de cierre de fase**.

## Hecho

Cerrada el 2026-11-28. Seis tareas en siete PR, todos desde `main` y fusionados con _squash_ por el coordinador:

| Issue | PR          | Qué                                                                                                                                                                                                                                                                               |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #54   | #98         | Calidad del 3D (baja, media y alta) en Ajustes: sombras, densidad de árboles, matorrales y público (`domain/world/quality.ts`, con aclarado por la secuencia áurea para que no queden huecos), distancia de dibujo. Por defecto, alta                                             |
| #58   | #99         | Pulso máximo de la sesión y del bloque (en ppm o «No pasar de Zn»): aviso al momento y cada 10 s, avisos de zona callados mientras suena, etiqueta en el player y «Por encima del máximo» en el resumen. Se guarda en la sesión, en la sesión en curso y en la copia de seguridad |
| #56   | #100        | Strava sin API (opción b): descarga del TCX al guardar (interruptor en Ajustes, activado por defecto) y botón «Abrir Strava para subir». Nada para sesiones simuladas; las rutas de ejemplo no llevan posición                                                                    |
| #59   | #101        | Reconexión de Bluetooth sin preguntar con `getDevices()` y `watchAdvertisements()` si Chrome los ofrece (opción experimental); si no, como antes. Desconectar a mano olvida el sensor                                                                                             |
| #60   | #102 y #104 | Transición al cambiar de bloque y cuenta atrás grande dentro del reloj en los últimos 5 s; anillo de zonas de pulso en el resumen; fantasma azul claro con etiqueta «Tú · día» y su marca y barra de distancia en el perfil                                                       |
| #55   | #105        | Pestaña «Inicio» (por defecto): próxima sesión del plan con «Empezar», semana día a día frente a la pasada, y forma y fatiga de hoy                                                                                                                                               |
| #57   | —           | Arco de meta y cámara de llegada: **descartado** por el usuario                                                                                                                                                                                                                   |

**Cómo se comprobó:** lint, tests (365 al final) y build en cada PR; lógica nueva en `src/domain/` con casos a mano (`hrCap`, `hrCapAlarm`, `countdown`, `donut`, `quality`, `weekDays`, `nextPlanDay`); cada mejora visible probada en Chrome headless con sensores simulados (`mejoras-inicio.mjs`, `mejoras-fantasma.mjs`, `mejoras-voz.mjs` y los de cada PR); `fase14-csp.mjs` sin violaciones en todos; manual y capturas en el mismo PR de cada mejora.

**Desviaciones:**

- #58 no sube la versión de Dexie: los campos son opcionales y `migrateWorkout` los normaliza (ver decisiones).
- La revisión de #99 encontró que la copia de seguridad perdía el `hrCap` del historial; se arregló en el mismo PR, con su test de ida y vuelta.
- Los PR que tocaban el player y los estilos (#99, #100, #102, #104) chocaron al fusionarse en paralelo; se pusieron al día con merge normal de `main`, nunca con `--force`.
- `t11-capturas-manual.mjs` y `fase6-zwo.mjs` pulsan «Sesiones» al empezar, porque la app se abre en «Inicio».

**Pendiente:** la reconexión de Bluetooth sin preguntar solo se pudo probar con simulados; la prueba con sensores reales está en el issue #19 (milestone «Pruebas con hardware real»).
