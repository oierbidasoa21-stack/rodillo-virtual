# Estado del proyecto

_Última actualización: 2026-11-25._

**Forma de trabajar:** en automático, sin pedir aprobación (plan en `fases/`, commits, push y fast-forward a `main`). **Solo ordenador**: no hay móvil.

## En una frase

Las **fases 0 a 5 están hechas y publicadas** en https://oierbidasoa21-stack.github.io/rodillo-virtual/ (`main` = `271472d`, 72 commits, 228 tests en verde). La **fase actual es la 6** (grabación y exportación), todavía sin empezar. Las fases 3, 4 y 5 están comprobadas con **sensores simulados**; falta probarlas con hardware real.

## Fases

| Fase  | Qué trae                                                                                                             | Estado                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 0     | Base: Vite + React + TS, lint, tests, CI y despliegue en GitHub Pages                                                | ✅ Hecha                                                  |
| 1     | Port de la v1: zonas por pulso, biblioteca, editor, player con voz y pitidos, contador de 10″, resumen, historial    | ✅ Hecha                                                  |
| 2     | PWA: instalable y sin conexión, aviso de actualización, almacenamiento persistente                                   | ✅ Hecha · falta tu prueba de instalación en el ordenador |
| 3     | Sensores Bluetooth: pulsómetro y velocidad/cadencia, sensores simulados, reconexión                                  | ✅ Hecha con simulados · falta prueba con hardware        |
| 4     | Potencia estimada (curvas de rodillo), ramp test con FTP, NP/IF/TSS/kJ, bloques por potencia, copia de seguridad     | ✅ Hecha con simulados · falta prueba con rodillo real    |
| 5     | Rutas 2D: GPX, 3 rutas inventadas, vista de carrera, perfil, minimapa, modo potencia y modo rueda, sesión sobre ruta | ✅ Hecha con simulados · falta prueba con hardware        |
| **6** | **Grabación a 1 Hz, recuperar sesión, exportar TCX, detalle con gráficas, `.zwo`**                                   | ⏳ **Siguiente**                                          |
| 7     | Mundo 3D (Three.js): carretera desde la altimetría, ciclista, escenario, HUD                                         | ⏳ Pendiente                                              |
| 8     | Rodillo inteligente FTMS: lectura, ERG y simulación (solo si se compra)                                              | ⏳ Opcional                                               |
| ~~9~~ | ~~Pruebas en móvil~~                                                                                                 | ❌ Descartada (solo ordenador)                            |

GitHub tiene un **milestone por fase** (0–5 cerrados, 6–8 abiertos, 9 cerrado por descartado) y otro, **«Pruebas con hardware real»**, con las pruebas que faltan. Las tareas pendientes están como **issues** dentro de su milestone.

## Qué funciona hoy (resumen)

- Biblioteca con 10 sesiones (8 por pulso de la v1 y 2 por potencia) y sesiones propias con editor (bloques por zona de pulso o % del FTP, repeticiones).
- Player a pantalla completa: zona u objetivo de potencia, reloj, perfil, voz y pitidos, +1′, saltar, contador de pulso de 10″, Wake Lock.
- Sensores Bluetooth (pulso, velocidad y cadencia) y **sensores simulados** en Ajustes → Desarrollo.
- Potencia estimada con 7 curvas de rodillos de fluido (con fuente) o curva personalizada; ramp test que estima el FTP; zonas Coggan.
- Rutas: 3 inventadas + importar GPX; vista de carrera con HUD, perfil y minimapa; modo potencia (física) o modo velocidad de rueda (sin potencia); sesión sobre ruta con vueltas.
- Resumen e historial: tiempo en zona (bloques o pulso medido), carga, kcal, potencia (NP, IF, TSS, kJ), distancia y desnivel.
- PWA instalable y sin conexión; copia de seguridad completa (exportar/importar JSON).

## Próximos pasos

1. **Fase 6** (grabación y exportación). Claude trabaja en automático: escribe el plan en `fases/` y lo ejecuta sin esperar aprobación.
2. Mejoras que pida el usuario (ver `pendientes/PENDIENTES.md`).
3. Cuando haya hardware: las pruebas del milestone «Pruebas con hardware real».
