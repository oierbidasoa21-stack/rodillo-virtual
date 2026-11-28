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

## Hecho (cerrada el 2026-11-28)

| Issue     | PR  | Resultado                                                                                                                                |
| --------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| #46       | #86 | nginx-unprivileged 1.29 (uid 101, puerto 8080), solo lectura con `/tmp` en `tmpfs`, `cap_drop: [ALL]`, `no-new-privileges` y límites     |
| #47       | #88 | CSP solo `'self'` y cabeceras en `docker/security-headers.conf`, incluido en cada `location`; la misma CSP en `<meta>` para GitHub Pages |
| #48       | #89 | Imágenes base por digest y todas las acciones por hash de commit, con la versión como comentario                                         |
| #49       | #90 | `npm audit` (producción bloquea desde alto) y Trivy (SARIF a Code scanning y puerta con críticos que tienen arreglo); `apk upgrade`      |
| #52 + #50 | #91 | Job `Publish image` en el workflow de release-please: GHCR con `x.y.z`, `x.y` y `latest`, SBOM, procedencia y firma cosign sin clave     |
| #51       | #92 | Perfil `prod` con Caddy fijado y endurecido, Let's Encrypt y HSTS; el 8080 del perfil normal solo en `127.0.0.1`                         |
| #53       | #93 | `docs/despliegue/README.md` y `SECURITY.md` completo                                                                                     |

**Comprobado:**

- **En local con Docker:** contenedor sin root y de solo lectura, healthcheck `healthy`, cabeceras en todas las rutas y Caddy con HTTPS 200 y la redirección 308 desde HTTP.
- **Script `pruebas/scripts/fase14-csp.mjs`:** 0 violaciones de CSP y 0 errores con `vite preview`, con Docker y contra **GitHub Pages** (tras desplegar #78 y #88), incluida la demo 3D sin conexión.
- **PWA en Pages tras vite-plugin-pwa 2.0:** sin errores de instalación ni de manifiesto (CDP `Page.getInstallabilityErrors`) y service worker activado.
- **Trivy en local:** pasa de 1 crítica y más de 30 altas con arreglo a 0 con `apk upgrade`.

**Dependabot (cerrados por el coordinador):**

- #77 (TypeScript 7): `npm ci` falla porque typescript-eslint exige `<6.1`. `dependabot.yml` ignora las mayores de TypeScript (#85).
- #73 (github-script 9): lo sustituye #85, que sube los dos workflows.
- #72 (Node 26): Node 24 se queda (LTS).
- #74 (nginx 1.29): incluido en #86.

**Pendiente del usuario (#82):** hacer público el paquete de GHCR tras la primera versión y activar el informe privado de vulnerabilidades. Las versiones (y por tanto la imagen en GHCR) empiezan cuando permita a Actions abrir PR.

**Lección:** los PR encadenados chocan con la fusión _squash_. Desde ahora, un PR que depende de otro espera a que el anterior esté en `main` y parte de ahí.
