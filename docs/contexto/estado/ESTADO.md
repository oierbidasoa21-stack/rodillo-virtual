# Estado del proyecto

_Última actualización: 2026-11-28._

**Forma de trabajar:** en automático, sin pedir aprobación (plan en `fases/`, commits, push y fast-forward a `main`). **Solo ordenador**: no hay móvil.

## En una frase

Las **fases 0 a 7 están hechas y publicadas** en https://oierbidasoa21-stack.github.io/rodillo-virtual/, más las mejoras de después (realismo 3D, forma y fatiga, fantasma, voz, plan del entrenador, Docker y pantalla completa). **La Fase 9 (mantenimiento) está cerrada; fase actual: 13 (GitHub profesional).** Orden de ejecución: 9 → 13 → 14 → 15a → 10 → T14 → 11 → 12 → 15b → Datos en Supabase → T13 → T19; la 8 queda en espera hasta que llegue el rodillo FTMS que el usuario va a comprar. El repo se queda público (T3 descartada) y la licencia es «todos los derechos reservados» (decisiones del 2026-11-28). Las fases 3 a 7 están comprobadas con **sensores simulados**; falta probarlas con hardware real.

## Fases

| Fase            | Qué trae                                                                                                             | Estado                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 0               | Base: Vite + React + TS, lint, tests, CI y despliegue en GitHub Pages                                                | ✅ Hecha                                                  |
| 1               | Port de la v1: zonas por pulso, biblioteca, editor, player con voz y pitidos, contador de 10″, resumen, historial    | ✅ Hecha                                                  |
| 2               | PWA: instalable y sin conexión, aviso de actualización, almacenamiento persistente                                   | ✅ Hecha · falta tu prueba de instalación en el ordenador |
| 3               | Sensores Bluetooth: pulsómetro y velocidad/cadencia, sensores simulados, reconexión                                  | ✅ Hecha con simulados · falta prueba con hardware        |
| 4               | Potencia estimada (curvas de rodillo), ramp test con FTP, NP/IF/TSS/kJ, bloques por potencia, copia de seguridad     | ✅ Hecha con simulados · falta prueba con rodillo real    |
| 5               | Rutas 2D: GPX, 3 rutas inventadas, vista de carrera, perfil, minimapa, modo potencia y modo rueda, sesión sobre ruta | ✅ Hecha con simulados · falta prueba con hardware        |
| 6               | Grabación a 1 Hz, recuperar sesión, exportar TCX, detalle con gráficas, `.zwo`                                       | ✅ Hecha con simulados · falta subir un TCX real          |
| 7               | Mundo 3D (Three.js): carretera desde la altimetría, ciclista, escenario, HUD                                         | ✅ Hecha · falta verla en tu portátil                     |
| 8               | Rodillo inteligente FTMS: lectura, ERG y simulación                                                                  | ⏳ En espera: el usuario comprará uno                     |
| 9               | Mantenimiento: zonas Z1…Z6, curvas suaves, seguimiento al día, README y manual                                       | ✅ Cerrada (2026-11-28)                                   |
| ~~9 (antigua)~~ | ~~Pruebas en móvil~~                                                                                                 | ❌ Descartada (solo ordenador)                            |

GitHub tiene un **milestone por fase** (0–7 cerrados, 8 abierto, 9 cerrado por descartado) y otro, **«Pruebas con hardware real»**, con las pruebas que faltan. Las tareas pendientes están como **issues** dentro de su milestone.

## Qué funciona hoy (resumen)

- Biblioteca con 10 sesiones (8 por pulso de la v1 y 2 por potencia) y sesiones propias con editor (bloques por zona de pulso o % del FTP, repeticiones).
- Player a pantalla completa: zona u objetivo de potencia, reloj, perfil, voz y pitidos, +1′, saltar, contador de pulso de 10″, Wake Lock.
- Sensores Bluetooth (pulso, velocidad y cadencia) y **sensores simulados** en Ajustes → Desarrollo.
- Potencia estimada con 7 curvas de rodillos de fluido (con fuente) o curva personalizada; ramp test que estima el FTP; zonas Coggan.
- Rutas: 3 inventadas + importar GPX; vista de carrera con HUD, perfil y minimapa; modo potencia (física) o modo velocidad de rueda (sin potencia); sesión sobre ruta con vueltas.
- Resumen e historial: tiempo en zona (bloques o pulso medido), carga, kcal, potencia (NP, IF, TSS, kJ), distancia y desnivel.
- PWA instalable y sin conexión; copia de seguridad completa (exportar/importar JSON).
- Vista 3D al rodar (carretera desde la altimetría, terreno, árboles, ciclista y cámara) con el HUD encima, y **Demo 3D** sin sensores en Rutas.
- Grabación segundo a segundo de cada sesión; «Sesión sin terminar» para retomar o guardar lo que se cerró a medias; detalle en el historial con gráficas, exportar TCX y borrar; importar y exportar `.zwo`.

## Próximos pasos

1. **Fase 8** solo si el usuario compra un rodillo inteligente (pendiente de que lo diga).
2. Mejoras que pida el usuario (ver `pendientes/PENDIENTES.md`).
3. Cuando haya hardware: las pruebas del milestone «Pruebas con hardware real».

_2026-11-26: vista 3D más realista (sombras, texturas, cielo con nubes, líneas laterales y balizas). El usuario ha probado el pulsómetro real (funciona) y ha importado una ruta GPX._

_2026-11-26 (2): segunda ronda de realismo 3D: montañas en el horizonte, vegetación densa con matorrales y rocas, ciclista detallado que se inclina en las curvas y cámara que acompaña._

_2026-11-26 (3): público animando en los bordes, quitamiedos, rodadas, arcén de grava y hora del día en la vista 3D._

_2026-11-26 (4): mejoras de entrenamiento: forma y fatiga en Historial, fantasma en las rutas, avisos de voz y plan del entrenador (informe y plan semanal con el agente del usuario). Ver `fases/mejoras-entrenamiento.md` y `docs/agente-entrenador.md`._

_2026-11-27: imagen Docker (`Dockerfile`, `compose.yaml`, `docker/nginx.conf`) y `docs/ESTRUCTURA.md` con qué es cada carpeta y archivo._

_2026-11-27 (2): el usuario pide **apuntar, no hacer**, una lista de tareas para su agente de cambios: fusionar el PR #31 (plan de los niveles de realismo, fases 10–12), zonas Z1…Z6, seguimiento al día, modo local con repo privado, Docker de producción, Fase 8 y AWS. Ver `pendientes/PENDIENTES.md` (T0–T6) y `estudios/2026-11-27-rodillo-inteligente-produccion-aws.md`._

_2026-11-27 (3): más tareas apuntadas: propuesta de roadmap (fases 9 y 13–15), GitHub profesional (T7), base de datos centralizada (T8, en estudio), rodillo casero (T9, en estudio). **Reparto:** Claude en la nube hace de intermediario y el agente de VS Code hace los cambios._

_2026-11-28: el agente de VS Code fusiona el PR #31 (plan de las fases 10–12) y el #32 (roadmap: «Fase actual: 9» y orden de ejecución). **T1 (zonas Z1…Z6) hecha en el [PR #33](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/33)**, con CI en verde y **abierto para que lo revise Claude en la nube** (no se fusiona sin revisión). 322 tests. Siguiente tarea de la Fase 9 tras la revisión: T12 (curvas suaves) o T2._

_2026-11-28 (2): PR #33 (T1, zonas Z1…Z6) revisado por Claude en la nube y fusionado. **T12 (curvas suaves) hecha en el [PR #35](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/35), abierto para revisión.** Plan y estado de la Fase 9 en `fases/fase-9-mantenimiento.md`. 328 tests._

_2026-11-28 (3): PR #35 (T12, curvas suaves) revisado dos veces y fusionado; Deploy en verde y demo comprobada en la web publicada. **T2 (seguimiento al día) en el [PR #36](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/36), abierto para revisión**: el `ROADMAP` ya recoge todas las fases y tareas apuntadas (13, 14, 15a, 15b, T14, T13, T19 y lo que está en espera). Queda T11 para cerrar la Fase 9._

_2026-11-28 (4): el agente de cambios pasa a ser una sesión en la nube lanzada y coordinada por Claude en la nube (regla 9 de `CLAUDE.md`); el usuario solo revisa. **T11 (README y manual) en el [PR #67](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/67), abierto para revisión**: `README.md` corto y [`docs/MANUAL.md`](../../MANUAL.md) con 12 apartados y capturas. Con T11 fusionada, la Fase 9 queda completa y la siguiente es la 13 (GitHub profesional)._

_2026-11-28 (5): PR #67 (T11) revisado por el coordinador. Con él se cierran T11 (issue #37) y la **Fase 9**; no hay milestone que cerrar, porque desde la nube no se crean (lo hará el workflow del issue #43 en la Fase 13). Las tareas pendientes del `ROADMAP` ya tienen issues con etiqueta de fase (#38–#66). **Siguiente: Fase 13 (GitHub profesional).**_
