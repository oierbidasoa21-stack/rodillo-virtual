# Fase 10 — Paisaje real · nivel 1 (relieve y satélite)

Pedido por el usuario el 2026-11-27: «que cuando pongas un .gpx se vea igual, todo el paisaje, como si fuese VR». Se hace por niveles: 1 relieve y satélite (esta fase), 2 OpenStreetMap (Fase 11), 3 Google 3D con clave propia (Fase 12, opcional).

## Fuentes (comprobadas: responden y permiten CORS)

- **Relieve:** AWS Terrain Tiles, formato Terrarium (PNG, altura = R·256 + G + B/256 − 32768 m). Sin clave. Resolución útil ~30 m.
- **Imagen:** Sentinel-2 cloudless de EOX (JPEG, 10 m/píxel), CC BY-NC-SA 4.0: uso no comercial con atribución.

## Diseño

- `src/domain/geo/`: Web Mercator (lon/lat ↔ tesela ↔ píxel), decodificación Terrarium, muestreo bilineal de un mosaico de alturas, y el paso entre los metros locales del mundo y lon/lat. Puro y con tests.
- `src/tiles/`: descarga con concurrencia limitada, progreso y Cache Storage (sin conexión después). Decodifica las imágenes en el navegador. No entra en `domain/`.
- Terreno real: una rejilla cercana (hasta 4 km de la ruta, celdas de 20–30 m) y un anillo lejano (hasta ~25 km) para el horizonte, con el relieve real. Junto a la carretera el suelo sigue a la carretera del GPX (como ahora) y se funde con el relieve real a ~60 m. La altura del GPX se corrige con la mediana de la diferencia con el relieve.
- Foto de satélite: mosaico en texturas por zonas, coordenadas UV desde el mundo a Mercator.
- En modo real no hay árboles, rocas ni montañas inventadas (la foto ya muestra lo que hay); se mantienen la carretera, las balizas y el público. Los árboles reales llegan en la Fase 11.
- Opt-in por ruta GPX: botón «Descargar paisaje real» con el tamaño estimado y el aviso de que esos servicios sabrán la zona (no el GPX). Atribución visible en la vista 3D.

## Forma de trabajo

Issues #22 (geo), #23 (teselas), #24 (terreno), #25 (satélite) y #26 (interfaz) en el milestone «Fase 10 — Paisaje real · nivel 1», una rama por issue y un PR que lo cierra; merge cuando CI pasa y está comprobado.

## Plan (2026-11-28)

Un PR por issue, **cada uno desde `main` actualizado y sin encadenar**. Si uno necesita lo de otro, espera a que el otro esté fusionado. El orden sigue las dependencias:

| Orden | Issue | Qué                                                                                                                          | Depende de |
| ----- | ----- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1     | #22   | `src/domain/geo/`: Web Mercator, teselas que cubren la ruta con su margen, Terrarium, mosaico bilineal, metros ↔ lon/lat     | —          |
| 2     | #23   | `src/tiles/`: descarga con concurrencia limitada, progreso y cancelación, Cache Storage, tamaño estimado. **Abre la CSP**    | #22        |
| 3     | #24   | Terreno real (rejilla cercana y anillo lejano), fundido con la carretera del GPX, corrección de altura por la mediana        | #22, #23   |
| 4     | #25   | Foto de satélite como textura del terreno cercano y del lejano                                                               | #24        |
| 5     | #26   | Interfaz: botón por ruta GPX con tamaño, progreso y aviso, uso automático al rodar, atribución, borrar lo descargado; manual | #23–#25    |

### CSP: qué se abre y por qué

La Fase 10 es la primera que habla con servicios externos. Se abre **solo `connect-src`** y **solo a dos orígenes**, comprobados el 2026-11-28 (responden con CORS a GitHub Pages y a `localhost`):

- `https://elevation-tiles-prod.s3.amazonaws.com`: relieve Terrarium. Con el nombre del bucket en el host, la CSP no deja hablar con el resto de S3, cosa que sí permitiría `s3.amazonaws.com`.
- `https://tiles.maps.eox.at`: Sentinel-2 cloudless.

Las teselas se piden con `fetch` y se convierten en `ImageBitmap` o en URL `blob:`, que `img-src` ya permite. Así `img-src` no se abre a nadie. El cambio va en `docker/security-headers.conf`, la fuente única, para que valga igual en Docker y en la `<meta>` de GitHub Pages. `fase14-csp.mjs` comprueba que no hay violaciones y que cualquier otro origen sigue bloqueado.

### Datos y privacidad

- **Teselas** en Cache Storage (caché propia `rodillo-virtual-tiles`), fuera de Dexie: son archivos, se pueden volver a bajar, y la caché HTTP no sirve sin conexión.
- **Qué rutas tienen paisaje** (ruta, zona, teselas, tamaño, fecha): tabla nueva en Dexie (**v7**, con su migración y test desde una base v6) en vez de un campo en `Route`, para no tocar las rutas guardadas.
- **Opt-in por ruta**: nada se descarga sin pulsar el botón. El aviso dice que esos servicios sabrán la zona aproximada (las teselas pedidas), pero nunca el GPX.
- Las rutas de ejemplo son inventadas y no tienen paisaje real: el botón solo sale en rutas GPX importadas.
- Sin paisaje descargado, o sin conexión y sin caché, la vista 3D es la de ahora. La app nunca inventa: si falta una tesela, ese trozo usa el suelo de siempre, no una altura supuesta.

### Criterios

- Lint, tests y build en verde en cada PR. Lógica nueva en `src/domain/geo/` con tests, con casos a mano: tesela de un punto conocido, píxel Terrarium decodificado y bilineal en el centro de una celda.
- Comprobado en Chrome headless contra los servicios reales, con un GPX de prueba **inventado** (no del usuario) sobre una zona con relieve. Scripts en `pruebas/scripts/fase10-*.mjs`.
- Rendimiento: la calidad del 3D de la Fase 15a (#54) también ajusta el tamaño de celda y el alcance del terreno real.
- Manual y capturas al día en el PR de la interfaz (#26), con atribución (EOX, CC BY-NC-SA 4.0, con datos modificados de Copernicus Sentinel; Terrain Tiles con sus fuentes).
- Contexto (`estado/`, `registro/`, `sesiones/`, este archivo y `PENDIENTES.md`) en un **PR de cierre de fase**.
