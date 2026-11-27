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

## Hecho (cerrada el 2026-11-28)

| Issue | PR  | Resultado                                                                                                                                       |
| ----- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| #39   | #68 | `LICENSE` (todos los derechos reservados), `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT` y `CHANGELOG`; este plan y los pasos        |
| #40   | #69 | Formularios de issue (error, mejora, tarea), plantilla de PR, `CODEOWNERS`, Dependabot semanal agrupado y 19 etiquetas con su workflow          |
| #43   | #70 | Workflow `Milestones`: crea los de las fases 9, 13, 14, 15a, 15b, Datos en Supabase y Tareas sueltas, y coloca los issues por su etiqueta       |
| #44   | #71 | CodeQL (en cada PR, en `main` y semanal) y OpenSSF Scorecard                                                                                    |
| #42   | #79 | Commitlint (commits y título del PR) y release-please desde la 0.9.0; su job no deja `main` en rojo mientras falte el permiso de Actions        |
| #38   | #80 | Insignias y enlaces en el `README`, e imagen para compartir (`.github/social-preview.jpg`)                                                      |
| #41   | #81 | `CLAUDE.md`: todo entra en `main` por PR con _squash_; el _ruleset_ lo activa el usuario tras la Fase 12 y hasta entonces se cumple por acuerdo |
| #45   | —   | No se hace: opcional y no pedido                                                                                                                |

**Pendiente del usuario, después de la Fase 12** (decidido el 2026-11-28): todo lo de [`pasos-usuario-fase-13.md`](../pendientes/pasos-usuario-fase-13.md), seguido en el issue #82. #41 se cerró como duplicado de #82. Al activar el permiso de Actions hay que quitar el `continue-on-error` del workflow de release-please.

**Cosas que salieron por el camino:**

- Al fusionar `dependabot.yml`, Dependabot abrió 7 PR (#72–#78). Los de versiones menores (#75, #76) los gestiona el coordinador; los saltos de versión mayor son una tarea propia antes de la Fase 14.
- El issue #49 de la Fase 14 queda en Trivy y `npm audit` (CodeQL ya está), y #48 suma fijar las acciones por hash.
- release-please no abrirá PR hasta el primer `feat` o `fix`: los de esta fase son `docs`, `ci` y `chore`.
