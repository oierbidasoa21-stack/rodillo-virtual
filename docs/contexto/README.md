# Contexto del proyecto

Esta carpeta guarda **todo el contexto de Rodillo Virtual** para que no se pierda al cambiar de conversación con Claude: dónde estamos, qué se decidió y por qué, qué se hizo en cada fase, cómo se prueba y qué queda.

**Si empiezas una conversación nueva, lee esto primero**, luego `estado/ESTADO.md`, y después lo que haga falta para la tarea.

## Índice

| Carpeta                                         | Qué contiene                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`estado/`](estado/ESTADO.md)                   | Dónde estamos ahora: fases hechas, pendientes y próximos pasos. **Lo primero que hay que leer.** |
| [`decisiones/`](decisiones/DECISIONES.md)       | Cada decisión tomada (por el usuario o técnica), con fecha y motivo.                             |
| [`fases/`](fases/)                              | Un archivo por fase: objetivo, qué se hizo, cómo se comprobó, desviaciones y pendientes.         |
| [`arquitectura/`](arquitectura/ARQUITECTURA.md) | Módulos, modelo de datos, versiones de la base de datos, formatos de archivo.                    |
| [`pruebas/`](pruebas/PRUEBAS.md)                | Cómo se prueba (tests, navegador headless, sensores simulados) y los scripts de prueba.          |
| [`pendientes/`](pendientes/PENDIENTES.md)       | Lo que falta: pruebas con hardware, limitaciones conocidas, ideas y mejoras pedidas.             |
| [`estudios/`](estudios/)                        | Respuestas largas a preguntas del usuario (opciones, costes, riesgos), sin código.               |
| [`registro/`](registro/CAMBIOS.md)              | Todos los commits, agrupados por fase.                                                           |
| [`entorno/`](entorno/ENTORNO.md)                | Repositorio, despliegue, herramientas y problemas del entorno ya resueltos.                      |
| [`sesiones/`](sesiones/)                        | Resumen de cada sesión de trabajo: qué se pidió y qué se hizo.                                   |

Las fuentes de verdad siguen siendo [`CLAUDE.md`](../../CLAUDE.md) (reglas del proyecto) y [`docs/ROADMAP.md`](../ROADMAP.md) (fases y casillas). Esta carpeta las complementa con la historia y el porqué; si algo choca, mandan esos dos archivos.

## Cómo se mantiene al día

Al terminar **cada tarea** (no solo cada fase):

1. **`estado/ESTADO.md`**: actualizar fase actual, lo hecho y lo siguiente.
2. **`registro/CAMBIOS.md`**: añadir los commits nuevos.
3. **`decisiones/DECISIONES.md`**: añadir cualquier decisión nueva, con fecha y motivo.
4. **`fases/fase-N-….md`**: ir completando la fase en curso.
5. **`pendientes/PENDIENTES.md`**: quitar lo resuelto, añadir lo que surja.
6. **`sesiones/AAAA-MM-DD.md`**: una entrada por sesión de trabajo.

Los scripts de prueba en navegador se guardan en `pruebas/scripts/` (antes vivían en una carpeta temporal y se perdieron).

## Qué no va aquí

- **Datos personales**: peso, peso de la bici, zonas de pulso, FTP real, GPX propios, exportaciones de entrenamientos. El repo es público. Esos datos viven en `config/athlete.local.json` y `data/`, ignorados por git.
- Secretos o credenciales (el proyecto no los necesita).
