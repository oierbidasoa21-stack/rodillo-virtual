# Despliegue

Cómo se publica Rodillo Virtual, qué hace cada pieza, cómo se actualiza y cómo se vuelve atrás. Está pensado para quien tenga que mantenerlo sin haber visto cómo se montó.

La app es **una web estática**: HTML, JavaScript, CSS, fuentes e iconos. No hay servidor de aplicación ni base de datos; los datos del usuario se quedan en su navegador. Desplegarla es servir unos archivos con las cabeceras correctas.

## Las tres formas de usarla

| Dónde              | Cómo                                  | Para qué                                                                                  |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| **GitHub Pages**   | Automático en cada push a `main`      | La forma normal. HTTPS incluido. https://oierbidasoa21-stack.github.io/rodillo-virtual/   |
| **Docker, local**  | `docker compose up -d`                | En tu ordenador, sin depender de GitHub: http://localhost:8080 (solo desde ese ordenador) |
| **Docker, `prod`** | `docker compose --profile prod up -d` | En un servidor propio con dominio: `https://tu-dominio`, con certificado de Let's Encrypt |

Cada dirección (Pages, `localhost:8080`, tu dominio) guarda **sus propios datos** en el navegador. Para pasar de una a otra: **Ajustes → Exportar copia** en la vieja e **Importar copia** en la nueva.

## Las piezas

### Build

`npm run build` compila con Vite a `dist/`. La ruta base es `/rodillo-virtual/` para Pages y `/` para Docker (variable `BASE_PATH`). El plugin de PWA genera el service worker, que guarda la app para usarla sin conexión.

### GitHub Pages (`.github/workflows/deploy.yml`)

En cada push a `main` (salvo si solo cambian `docs/` o archivos `.md`): lint, tests y build, y publica `dist/` en Pages.

Pages no deja poner cabeceras HTTP, así que la **CSP va en una `<meta>`** dentro del `index.html`. La pone un plugin de `vite.config.ts` a partir de `docker/security-headers.conf`, para que las dos nunca se separen.

### Imagen Docker (`Dockerfile`)

Dos etapas:

1. **Build**: `node:24-alpine` compila la app. No pasa a la imagen final.
2. **Servir**: `nginxinc/nginx-unprivileged:1.31-alpine`.
   - nginx corre como el usuario `nginx` (uid 101), **no como root**, y escucha en el 8080.
   - Al construir se aplican los parches de seguridad de Alpine (`apk upgrade`) y se quita `curl`, que no hace falta.
   - Tiene un `HEALTHCHECK` que comprueba que responde.

Las dos imágenes base están **fijadas por digest** (`@sha256:…`): nadie puede cambiarlas por debajo. La imagen solo lleva el atleta de ejemplo; `config/*.local.json`, `data/` y `.env` están en `.dockerignore`.

### nginx (`docker/nginx.conf` y `docker/security-headers.conf`)

- Los archivos de `/assets/` llevan un hash en el nombre y se guardan en caché un año. `index.html` y `sw.js` van sin caché, para que las actualizaciones lleguen.
- Cualquier ruta desconocida devuelve `index.html`.
- `server_tokens off`: no dice qué versión de nginx es.
- **Cabeceras de seguridad**, en `security-headers.conf`, incluido en el `server` y **en cada `location`**. En nginx, un `add_header` dentro de un `location` borra los heredados; si se añade un `location` nuevo, hay que incluir ahí el archivo.
  - **Content-Security-Policy**: la app solo puede cargar código, estilos y fuentes de su propio origen (`'self'`). Las imágenes pueden ser también `data:` y `blob:` (texturas y descargas). Para datos (`connect-src`), además del propio origen, solo los dos servidores de teselas del paisaje real (Fase 10): `https://elevation-tiles-prod.s3.amazonaws.com` (relieve) y `https://tiles.maps.eox.at` (satélite). Nada de `unsafe-inline` ni `unsafe-eval`. `frame-ancestors 'none'`: nadie puede meterla en un iframe.
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy: same-origin` y `X-Frame-Options: DENY`.
  - **Permissions-Policy**: solo Bluetooth, mantener la pantalla encendida y pantalla completa, y solo en el propio sitio. Cámara, micrófono, ubicación, pagos, USB, puerto serie y HID desactivados.

### Contenedor endurecido (`compose.yaml`)

- `read_only: true`: el sistema de archivos es de solo lectura; solo `/tmp` se puede escribir (en memoria, 16 MB).
- `cap_drop: [ALL]` y `no-new-privileges`: sin capacidades de Linux ni forma de ganar privilegios.
- Límites: 0,5 CPU, 128 MB de memoria y 64 procesos.
- El puerto 8080 se publica **solo en `127.0.0.1`**.

### Perfil `prod` con Caddy (`docker/Caddyfile`)

Caddy va delante de la app:

- pide y renueva solo el certificado de Let's Encrypt para `DOMAIN`;
- redirige HTTP a HTTPS y añade **HSTS** (un año);
- comprime con zstd y gzip;
- pasa todo a la app.

Va fijado por digest y endurecido igual que la app; solo conserva `NET_BIND_SERVICE`, para usar los puertos 80 y 443. Los certificados se guardan en los volúmenes `caddy-data` y `caddy-config`.

Para ponerlo en marcha en un servidor:

1. Un dominio que apunte a la IP del servidor, con los puertos 80 y 443 abiertos.
2. `cp .env.example .env` y pon tu dominio en `DOMAIN`.
3. `docker compose --profile prod up -d --build`.
4. Abre `https://tu-dominio`. La primera vez Caddy tarda unos segundos en conseguir el certificado.

Sin `DOMAIN`, sirve `https://localhost` con un certificado local, que el navegador avisará de que no conoce. Sirve para probar.

### CI (`.github/workflows/`)

| Workflow         | Cuándo                    | Qué comprueba                                                                                                  |
| ---------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `CI`             | Cada push y PR            | Lint, tests y build; `npm audit` (falla con fallos altos en dependencias de producción); imagen Docker y Trivy |
| `Commitlint`     | Cada PR                   | Conventional Commits en los commits y en el título                                                             |
| `CodeQL`         | Cada PR, `main` y semanal | Análisis de seguridad del código y de los workflows                                                            |
| `Scorecard`      | `main` y semanal          | Prácticas de seguridad del repo (OpenSSF)                                                                      |
| `Release Please` | Cada push a `main`        | PR de versión con `CHANGELOG`; al fusionarlo, etiqueta, release e imagen en GHCR                               |
| `Deploy`         | Push a `main`             | Publica en GitHub Pages                                                                                        |

**Trivy** escanea la imagen: todo lo que encuentra va a **Security → Code scanning**, y el build falla si hay una vulnerabilidad crítica que ya tiene arreglo.

Todas las acciones están **fijadas por hash de commit**, con la versión en un comentario.

### Versiones e imagen en GHCR

1. Con cada `feat` o `fix` que llega a `main`, release-please actualiza un PR «chore(main): release x.y.z».
2. Al fusionarlo, crea la etiqueta `vx.y.z`, la release de GitHub y, en el mismo workflow, publica la imagen:
   - `ghcr.io/oierbidasoa21-stack/rodillo-virtual:x.y.z`, `:x.y` y `:latest`;
   - con su **SBOM** (lista de todo lo que lleva, en SPDX) y su **procedencia** (cómo y desde qué commit se construyó);
   - **firmada con cosign** sin clave, con la identidad del workflow de GitHub.

Esto empieza a funcionar cuando el dueño del repo permite a Actions abrir PR (pasos en `docs/contexto/pendientes/pasos-usuario-fase-13.md`, después de la Fase 12).

Para comprobar que una imagen es la que publicó este repo:

```sh
cosign verify ghcr.io/oierbidasoa21-stack/rodillo-virtual:x.y.z \
  --certificate-identity-regexp 'https://github.com/oierbidasoa21-stack/rodillo-virtual/.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Para usar una versión publicada en lugar de construirla, cambia en `compose.yaml` `build: .` e `image: rodillo-virtual` por `image: ghcr.io/oierbidasoa21-stack/rodillo-virtual:x.y.z`.

## Actualizar

- **Dependencias, imágenes base y acciones**: Dependabot abre PR los lunes (npm, acciones, `Dockerfile` y `compose.yaml`). Con el CI en verde y revisados, se fusionan. Los saltos de versión mayor se prueban uno a uno antes.
- **La web publicada** se actualiza sola al fusionar en `main`. La app instalada avisa con «Nueva versión disponible».
- **Docker local**: `git pull` y `docker compose up -d --build`.
- **Docker con versión de GHCR**: cambia la etiqueta en `compose.yaml` y `docker compose pull && docker compose up -d`.

## Volver atrás

- **GitHub Pages**: revierte en `main` el cambio que falló (`git revert` en un PR). Al fusionarlo se vuelve a publicar la versión anterior. Si hay prisa, en **Actions → Deploy** se puede volver a lanzar el workflow sobre un commit anterior bueno.
- **Docker con GHCR**: pon en `compose.yaml` la etiqueta de la versión anterior (`:x.y.z`) y `docker compose up -d`. Por eso se publica cada versión con su número.
- **Docker construido en local**: `git checkout vx.y.z` y `docker compose up -d --build`.
- Los datos del usuario no se tocan al volver atrás: están en su navegador. Si una versión nueva cambió el formato de los datos (migración de Dexie), una versión anterior puede no leerlos. Antes de un cambio así, conviene **Exportar copia**.

## Abrir la CSP a un servicio nuevo

La CSP solo deja usar el propio origen y, para datos, los dos servidores de teselas de la Fase 10. Cuando una fase necesite otro servicio externo:

1. Añade el dominio, solo ese, a la directiva que toque en `docker/security-headers.conf`: `img-src` para imágenes, `connect-src` para `fetch`. Si lo pide el código de `src/tiles/`, añádelo también en `src/tiles/sources.ts`: el test `src/tiles/csp.test.ts` falla si la lista y la política no coinciden.
2. La `<meta>` de Pages se actualiza sola en el siguiente build.
3. Comprueba que no hay violaciones con `docs/contexto/pruebas/scripts/fase14-csp.mjs`, contra `npm run preview` y contra Docker.

## Si algo falla

- **La página sale en blanco y la consola habla de «Content Security Policy»**: algo intenta cargar desde fuera o ejecutar código en línea. Mira qué directiva y qué dirección, y ábrela solo si de verdad hace falta.
- **`docker compose up` falla al leer la imagen**: Docker Hub limita las descargas anónimas. Espera un rato o inicia sesión con `docker login`.
- **Caddy no consigue el certificado**: el dominio tiene que apuntar al servidor y los puertos 80 y 443 tienen que estar abiertos. Lo verás en `docker compose --profile prod logs caddy`.
- **Trivy falla en CI**: hay una vulnerabilidad crítica con arreglo. Normalmente se resuelve con el PR de Dependabot de la imagen base. Si no hay, el `apk upgrade` del `Dockerfile` ya trae el parche en el siguiente build.
