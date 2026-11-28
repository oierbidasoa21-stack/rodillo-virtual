# Fase 14 — Docker de producción y seguridad

Tarea T4 de `pendientes/PENDIENTES.md`, issues #46–#53 (etiqueta `fase-14`). El porqué de cada punto está en el punto 2 del [estudio del 2026-11-27](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).

Objetivo: que la imagen Docker y la web publicada estén preparadas como en una empresa: sin privilegios, con cabeceras de seguridad y CSP, reproducibles, escaneadas, firmadas y con versión. Va **antes de la Fase 10** a propósito: la CSP estricta se pone ahora, y la Fase 10 solo tendrá que abrir los servicios de teselas que necesite.

## Plan

Un PR por issue, en este orden, cada uno con `Closes #n`. El agente avisa al coordinador de cada PR y sigue con el siguiente mientras lo revisa, salvo que dependa del anterior.

| Orden | Issue     | Qué                                                                    | Cómo                                                                                                                    |
| ----- | --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1     | #46       | nginx sin root, solo lectura, `cap_drop`, `no-new-privileges`, límites | `nginxinc/nginx-unprivileged` (puerto 8080 dentro), `compose.yaml` endurecido con `tmpfs`                               |
| 2     | #47       | Cabeceras de seguridad y CSP                                           | `docker/security-headers.conf` incluido en cada `location`; en GitHub Pages, la CSP en una `<meta>` del `index.html`    |
| 3     | #48       | Imágenes por digest y acciones por hash de commit                      | `FROM …@sha256:…` y `uses: …@<sha> # vX`; Dependabot ya actualiza los dos                                               |
| 4     | #49       | Trivy y `npm audit` en CI                                              | Jobs nuevos en `ci.yml`; Trivy sube el SARIF a Code scanning                                                            |
| 5     | #52 + #50 | Imagen en GHCR por versión, con SBOM y firma                           | Job en el workflow de release-please que solo corre cuando se crea una versión (ver abajo); SBOM con Syft, firma cosign |
| 6     | #51       | Perfil `prod` con Caddy y HTTPS                                        | `compose.yaml` con `profiles: [prod]` y un `Caddyfile` (Let's Encrypt, HSTS)                                            |
| 7     | #53       | `docs/despliegue/` y `SECURITY.md`                                     | Qué hace cada pieza, cómo actualizar y cómo volver atrás                                                                |

## Decisiones de partida

- **Node 24 se queda** en Docker, CI y `.nvmrc`. Es LTS hasta 2028 y lo usa todo el proyecto. Subir a Node 26 sería un cambio de todo el proyecto, no solo de la imagen. Por eso el #72 de Dependabot se cierra.
- **nginx: rama 1.29** (la _mainline_, que es la que recomienda nginx), en su variante sin root. Así el #74 queda incluido en #46.
- **La imagen se publica desde el mismo workflow de release-please.** Una release creada con `GITHUB_TOKEN` no lanza otros workflows (`on: release`), así que un workflow aparte nunca se ejecutaría. Hasta que el usuario active el permiso de Actions (tras la Fase 12), release-please no crea versiones y, por tanto, tampoco se publica imagen. Queda preparado.
- **CSP en GitHub Pages con `<meta>`**: Pages no deja poner cabeceras. Con `<meta>` no funcionan `frame-ancestors` ni las demás cabeceras; eso queda solo en Docker.

## Criterios

- Cada PR con lint, tests y build en verde, y la imagen Docker construida en CI.
- La app sigue funcionando con la CSP: PWA y service worker, sin conexión, Web Bluetooth (sensores simulados en headless), la demo 3D con Three.js y la importación de archivos.
- Contexto (`estado/`, `registro/`, `sesiones/`, este archivo y la línea de T4 en `PENDIENTES.md`) en un **PR de cierre de fase**, como en la Fase 13.

## Hecho

_(se completa en el PR de cierre de la fase)_
