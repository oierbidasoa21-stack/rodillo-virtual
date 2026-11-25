# Pendientes

_Última actualización: 2026-11-25._

## Fases por hacer

Ver el detalle en [`fases/`](../fases/) y en `docs/ROADMAP.md`. Cada tarea es un issue en su milestone de GitHub.

- **Fase 6 · Grabación y exportación**: grabación a 1 Hz, recuperar sesión si se cierra la pestaña, exportar TCX (Strava, Garmin), detalle de cada salida con gráficas, importar y exportar `.zwo`.
- **Fase 7 · Mundo 3D**: carretera 3D desde la altimetría, ciclista y cámara, escenario procedural, HUD de la Fase 5 encima.
- **Fase 8 · Rodillo inteligente (opcional)**: FTMS, modo ERG, modo simulación.

## Pruebas con hardware real (milestone propio)

- [ ] Fase 2: instalar la PWA en Chrome para Windows, usarla sin conexión y ver el aviso de actualización.
- [ ] Fase 3: banda de pulso y sensor de velocidad/cadencia reales (pulso, velocidad y cadencia en directo, reconexión).
- [ ] Fase 4: rodillo real (elegir su modelo o meter su curva) y ramp test de verdad.
- [ ] Fase 5: una ruta completa con sensores reales.

## Limitaciones conocidas

- Chrome pide elegir el sensor Bluetooth una vez por sesión de la app (reconectar sin pedirlo requiere un flag experimental).
- El player con ruta cabe justo en 1280×900; en pantallas más bajas necesita algo de scroll.
- El IF y el TSS se calculan con el FTP del momento; cambiar el FTP no recalcula sesiones antiguas.
- Tras un ramp test con simulados se puede guardar un FTP simulado (avisa de que no es real).
- Una sesión retomada no guarda el hueco en que la app estuvo cerrada: el TCX lleva el tiempo en movimiento seguido.
- La vista 3D está en «Rodar» y en la demo; la sesión sobre ruta sigue con la franja 2D.
- Los fps de la vista 3D solo se han medido en headless; falta verlo en el portátil del usuario.
- El TCX aún no se ha subido de verdad a Strava ni a Garmin Connect (se genera siguiendo el orden del esquema TCX v2 y los tests comprueban ese orden, pero no se ha validado contra el XSD).

## Ideas y mejoras pedidas

- **Importar rutas en otros formatos** (KML, TCX) además de GPX. Hoy solo GPX con altitud. Para rutas dibujadas a mano: gpx.studio, Strava, Komoot o RideWithGPS exportan GPX con altitud; Google Maps no exporta GPX y «Mis mapas» da KML sin altitud (pregunta del usuario, 2026-11-25).
- _(Añadir aquí las mejoras que pida el usuario.)_
