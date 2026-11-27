# Fase 13 — GitHub profesional

Tarea T7 de `pendientes/PENDIENTES.md`, issues #38–#45 (etiqueta `fase-13`). Objetivo: que el repo se vea y se trabaje como el de una empresa pequeña: archivos estándar, plantillas, todo por PR con CI obligatorio, versiones automáticas y seguridad básica.

Decisiones de partida (del usuario, 2026-11-28): el repo **se queda público** (las reglas de rama son gratis) y la licencia es **«todos los derechos reservados»**.

## Plan

Un PR por issue, en este orden, cada uno con `Closes #n`. El agente de cambios avisa al coordinador de cada PR y sigue con el siguiente mientras lo revisa.

| Orden | Issue | Qué                                                                                             | Cómo                                                     |
| ----- | ----- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1     | #39   | `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, `CHANGELOG.md` | Archivos en la raíz                                      |
| 2     | #40   | Plantillas de issue (formulario) y de PR, `CODEOWNERS`, `dependabot.yml`, etiquetas             | Archivos en `.github/` y workflow que crea las etiquetas |
| 3     | #43   | Milestones por fase con sus issues; tablero de Projects                                         | Workflow manual; el tablero, pasos para el usuario       |
| 4     | #44   | CodeQL, Scorecard, escaneo de secretos, alertas de Dependabot, informe privado                  | Workflows; lo que sea ajuste del repo, pasos             |
| 5     | #42   | Commitlint en CI y release-please                                                               | Workflows; la imagen en GHCR va con la Fase 14 (#52)     |
| 6     | #38   | Insignias y `README`; descripción, temas e imagen social                                        | `README` y una imagen; el resto, pasos                   |
| 7     | #41   | Reglas de `main`: solo por PR, CI obligatorio, historial lineal, _squash_, borrar ramas         | Pasos para el usuario y `CLAUDE.md`                      |
| —     | #45   | Organización gratuita                                                                           | **No se hace**: opcional y no pedido                     |

Lo que solo puede hacer el usuario en _Settings_ de GitHub está en [`../pendientes/pasos-usuario-fase-13.md`](../pendientes/pasos-usuario-fase-13.md), con pasos numerados.

## Criterios

- Cada PR con lint, tests y build en verde. Ninguno cambia la app.
- Los workflows nuevos tienen permisos mínimos (`permissions:` por job) y acciones fijadas a una versión.
- **Contexto (`estado/`, `registro/`, `sesiones/`, este archivo y las líneas de `PENDIENTES.md`) en un PR propio al cerrar la fase.** Motivo: los PR de la fase se revisan en paralelo; si cada uno tocara las mismas tablas y listas, chocarían entre sí al fusionarlos en orden. Mientras tanto, el estado de cada PR se ve en GitHub (issue y PR enlazados).

## Hecho

_(se completa en el PR de cierre de la fase)_
