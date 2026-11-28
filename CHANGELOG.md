# Changelog

## [0.10.0](https://github.com/oierbidasoa21-stack/rodillo-virtual/compare/v0.9.0...v0.10.0) (2026-11-28)


### Funciones nuevas

* **docker:** perfil prod con Caddy delante para HTTPS y HSTS ([0c62210](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/0c62210c892acaac2e1a10ae6c907d2e18258a43))
* **docker:** plan de la Fase 14 y nginx sin root con solo lectura ([#86](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/86)) ([84a98e5](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/84a98e5bc1e207900c12879660fcdb60977ab6fd))
* **docker:** prod profile with Caddy in front for HTTPS and HSTS ([0aa46e2](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/0aa46e20418ae4c5294f32ef6e5d28b1609effb2)), closes [#51](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/51)
* **docker:** run nginx without root on a read-only filesystem ([4ae5af6](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/4ae5af66113a8e3187ce2a1dc7c3dccf7fe2e4cb)), closes [#46](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/46)
* **geo:** add tile maths, terrarium decoding and height mosaic ([#109](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/109)) ([d5480a3](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/d5480a3d8156bfcf1c1a87972554919eb60b813e)), closes [#22](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/22)
* **home:** add home panel with week, form and next plan session ([#105](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/105)) ([bb2f6b2](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/bb2f6b295906d5c8dff06b3c962634ff871d5a3d))
* **metrics:** add zone donut and make the ghost easier to spot ([#104](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/104)) ([962ba80](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/962ba805557457fe2d6216fa83712a91a518244a))
* **player:** transición entre bloques y cuenta atrás grande en los últimos 5 s ([#102](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/102)) ([32c6360](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/32c63603968624c955b2113df9239618085d3d85))
* **routes:** download, complete and delete a GPX route's real landscape ([#113](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/113)) ([21754ba](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/21754ba8a91e3b798a4a9ae29c311c7608363997))
* **security:** CSP estricta y cabeceras de seguridad en Docker y GitHub Pages ([#88](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/88)) ([97e8383](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/97e8383cd10a2f4070e93a20667d80a3d0080bc5))
* **security:** strict CSP and security headers in Docker and on GitHub Pages ([6c07aa6](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/6c07aa6aa260990a3fe747516ac914fc2acda61a)), closes [#47](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/47)
* **sensors:** reconexión de Bluetooth sin preguntar, si Chrome lo permite ([#101](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/101)) ([1518bf5](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/1518bf54c474d19864192c24820f702285e87968))
* **session:** descargar el archivo al guardar y botón «Abrir Strava para subir» ([#100](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/100)) ([2b7ccdb](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/2b7ccdb3c2e87893dd24f773ce335b1ac4525bc0))
* **tiles:** download and cache landscape tiles; open the CSP to the two tile servers ([#110](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/110)) ([d65d190](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/d65d1909e78fe6f6c142d1dd709423257df1fa9d))
* **workout:** pulso máximo de la sesión y del bloque, con aviso inmediato ([#99](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/99)) ([c2457af](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/c2457afca6ad1a2a99f2b6e86cc12105b4634739))
* **world:** real relief in the 3D view from cached elevation tiles ([#111](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/111)) ([d570f3c](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/d570f3c036d9e544fbea95c4a5030e852e22a1eb))
* **world:** satellite photo on the real terrain and horizon ([#112](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/112)) ([41896c0](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/41896c08d10452f395172e1f77df95d24512450c))
* **world:** selector de calidad gráfica del 3D ([#98](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/98)) ([512d8d4](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/512d8d4960541995153f4b459df000ade8497eb1))


### Documentación

* **claude:** todo entra en main por PR con squash y checks obligatorios ([#81](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/81)) ([4cb666d](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/4cb666d25b245cd4bbfe96c96b1eaa367e0f9856))
* **contexto:** cierre de la Fase 13 ([#83](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/83)) ([56f05fa](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/56f05fa63553d0133763452bcb937d935a5572a3))
* **contexto:** close phase 14; Docker in the manual, GHCR package step for the owner ([#95](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/95)) ([6f8c961](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/6f8c961ec2951730654526e3a5f4d174cb055faa))
* **contexto:** close phase 15a ([#106](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/106)) ([590fe91](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/590fe91cb6650897647d9cd248423faf2239f650))
* **contexto:** drop the finish arch (T16) and update the tracking page ([#103](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/103)) ([4d88799](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/4d88799d6538980dec90742318a4a16cd003f536))
* **contexto:** GitHub settings steps after phase 12 ([23f16ea](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/23f16ea11c3769dc01c579603b73f6f485d11933))
* **contexto:** phase 10 plan ([#108](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/108)) ([fdc0ab4](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/fdc0ab4f90f2caca417f2f111aa377f5fd09c8f3))
* **contexto:** phase 14 plan ([dc53ff4](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/dc53ff46016fc8f0729cce98ffd42bda72f5411a))
* **contexto:** phase 15a plan ([#96](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/96)) ([c65fdab](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/c65fdab4d3fb079a4613e9526ecd55d43fa95567))
* **contexto:** phase 9 closed, phase 13 under way on the tracking page ([ab6c4f8](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/ab6c4f846ff43fa6a8111ff3499bf6a7a58b5ab0))
* **contexto:** tracking page with phase 13 closed ([#84](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/84)) ([7fec13c](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/7fec13cea505154be77c2d675bba052a38cce06d))
* **contexto:** tracking page with phase 14 closed ([#97](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/97)) ([137e41c](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/137e41c881c1432a97ab2dee7e29bb56e98aba6c))
* **contexto:** tracking page with phase 15a closed ([#107](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/107)) ([8afe09d](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/8afe09d9986ec7db3261600972167af15c692f5a))
* **despliegue:** cómo se publica, se actualiza y se vuelve atrás; SECURITY.md completo ([ad676ff](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/ad676ff9985ca9e3ad27d02ebf138b9621a2b8e7))
* **despliegue:** how the app is deployed, updated and rolled back; SECURITY.md completed ([adfcea7](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/adfcea74583da165bb1e08378eca0525779ba2ef)), closes [#53](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/53)
* plan de la Fase 13 y archivos estándar del repo ([#68](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/68)) ([2fcb662](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/2fcb662d0a000ff74351fd089491f834180f7ffa))
* **readme:** badges, links to the standard files and a social preview image ([#80](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/80)) ([f510567](https://github.com/oierbidasoa21-stack/rodillo-virtual/commit/f510567cab513df06d9e3b1a3b375f71fa2100c5)), closes [#38](https://github.com/oierbidasoa21-stack/rodillo-virtual/issues/38)

## Changelog

Cambios de cada versión de Rodillo Virtual. A partir de la primera versión numerada, este archivo lo mantiene release-please a partir de los commits (Conventional Commits).

## Antes de las versiones numeradas

Hasta la Fase 13 no había versiones. Resumen de lo publicado, por fase (el detalle de cada commit está en [`docs/contexto/registro/CAMBIOS.md`](docs/contexto/registro/CAMBIOS.md)):

- **Fase 0:** base con Vite, React y TypeScript; lint, tests, CI y despliegue en GitHub Pages.
- **Fase 1:** zonas por pulso, biblioteca y editor de sesiones, player con voz y pitidos, contador de 10″, resumen e historial.
- **Fase 2:** app instalable que funciona sin conexión, con aviso de actualización.
- **Fase 3:** sensores Bluetooth de pulso, velocidad y cadencia, y sensores simulados.
- **Fase 4:** potencia estimada con curvas de rodillo, ramp test, NP, IF, TSS y copia de seguridad.
- **Fase 5:** rutas con pendiente, importar GPX, modo potencia y modo rueda.
- **Fase 6:** grabación segundo a segundo, recuperar sesiones, exportar TCX y `.zwo`.
- **Fase 7:** mundo 3D al rodar.
- **Después de la Fase 7:** realismo 3D, forma y fatiga, fantasma, avisos de voz, plan del entrenador, imagen Docker y pantalla completa.
- **Fase 9:** zonas Z1…Z6, curvas suaves en 3D, README corto y manual de uso.
