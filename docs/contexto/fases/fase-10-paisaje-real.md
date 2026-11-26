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
