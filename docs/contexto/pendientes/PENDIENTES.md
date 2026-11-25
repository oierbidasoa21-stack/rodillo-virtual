# Pendientes

_Última actualización: 2026-11-25._

## Fases por hacer

Ver el detalle en [`fases/`](../fases/) y en `docs/ROADMAP.md`. Cada tarea es un issue en su milestone de GitHub.

- **Fase 6 · Grabación y exportación**: grabación a 1 Hz, recuperar sesión si se cierra la pestaña, exportar TCX (Strava, Garmin), detalle de cada salida con gráficas, importar y exportar `.zwo`.
- **Fase 7 · Mundo 3D**: carretera 3D desde la altimetría, ciclista y cámara, escenario procedural, HUD de la Fase 5 encima.
- **Fase 8 · Rodillo inteligente (opcional)**: FTMS, modo ERG, modo simulación.
- **Fase 9 · Móvil**: instalar en Android y modo avión, sesión completa, sensores en el móvil, ajustes de pantalla pequeña, almacenamiento persistente.

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

## Ideas y mejoras pedidas

- **Demo como artefacto de Claude** para el prototipo final (pedido 2026-11-25). No sustituye a la PWA (sin Bluetooth ni instalación como app), pero sirve como demo compartible con sensores simulados. Pendiente de decidir.
- _(Añadir aquí las mejoras que pida el usuario.)_
