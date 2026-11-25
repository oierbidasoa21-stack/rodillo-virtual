# Cómo se prueba

## 1. Tests unitarios (Vitest)

- `npm run test`: **228 tests en 38 archivos** al cerrar la Fase 5.
- Cada fórmula tiene al menos un caso calculado a mano en el propio test (por ejemplo, 246,6 W en llano con 90,6 kg dan 10 m/s; 1 h a 200 W con FTP 200 da TSS 100).
- Almacenamiento con `fake-indexeddb`, incluidas las migraciones v1 → v2 → v3 desde bases de la versión anterior.
- Bluetooth con dispositivos falsos y temporizadores simulados (reintentos 1-2-4… 30 s).

Antes de cada commit tienen que pasar `npm run lint`, `npm run test` y `npm run build`.

> ⚠️ En Windows, lanza los comandos desde la ruta con la unidad en **mayúscula** (`C:\Users\…`). Si la carpeta se abre como `c:\…`, Vitest carga dos veces sus módulos y falla con `Cannot read properties of undefined (reading 'config')` sin ejecutar ningún test. Ver [`entorno/ENTORNO.md`](../entorno/ENTORNO.md).

## 2. Pruebas en navegador headless

Claude usa la skill `browser-automation` (un Chrome sin ventana, con patchright) contra `npm run preview` (build de producción) y, al cerrar cada fase, contra la web publicada.

- Tamaño de escritorio (1280×800 o 1280×900), en claro y oscuro, con capturas que Claude revisa.
- **Reloj simulado** (`page.clock`) para recorrer sesiones y rutas enteras en segundos.
- **Sensores simulados** (Ajustes → Desarrollo) para pulso, velocidad, cadencia y potencia.
- Sin conexión: `page.context().setOffline(true)`.
- Service worker: patchright evalúa en un contexto aislado donde `navigator.serviceWorker` no funciona; se inyecta un `<script>` con `page.addScriptTag` y se lee el resultado de un atributo del DOM.
- Versión nueva de la PWA: se añade un comentario a `dist/sw.js` con `vite preview` en marcha.
- Migraciones en navegador real: se siembra IndexedDB con la versión antigua desde una página del mismo origen servida con `page.route`.

**Scripts:** a partir de ahora se guardan en [`scripts/`](scripts/). Los de las fases 0–5 vivían en una carpeta temporal de Claude y se borraron; abajo queda qué comprobaba cada uno.

## 3. Qué se comprobó en cada fase (resumen)

| Fase | Comprobación en navegador                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Crear/editar/borrar sesiones y persistencia tras recargar; ajustes e importación de `athlete.json`; sesión completa con contador de pulso y resumen; historial                                                        |
| 2    | Manifest e iconos; service worker activo; **sesión entera sin conexión**; aviso de actualización que espera al player y al editor                                                                                     |
| 3    | Sensores simulados con valores en directo; «Sin cadencia»; caída y reconexión; player con «En zona»; resumen «Medido por pulsómetro (simulado)»                                                                       |
| 4    | Migración v1 → v2 sembrada; copia de seguridad exportar/importar; ramp test completo hasta guardar el FTP; sesión por potencia con NP/IF/TSS y TSS en el historial                                                    |
| 5    | Migración v2 → v3; importar GPX bueno y roto; Puerto entero en modo potencia (velocidad en llano/subida, distancia y desnivel finales); modo rueda; sesión sobre ruta con 2 vueltas; player con ruta cabe en 1280×900 |
| 6    | Sesión guardada cada 10 s, recarga, «Sesión sin terminar» y Retomar; detalle con 5 gráficas, TCX de 240 puntos y borrar; `.zwo` exportar/importar igual, rampa con aviso y archivo roto (scripts `fase6-*.mjs`)       |
| 7    | Demo 3D en el Puerto y el Rompepiernas a 60 fps (headless), HUD, cambio 2D/3D, nada guardado; la salida de la Fase 6 en 3D sigue grabando (script `fase7-demo-3d.mjs`)                                                |

## 4. Pruebas manuales del usuario (pendientes)

Todas en Chrome para Windows, con la web publicada:

- **Fase 2:** instalar la app, abrirla sin conexión y ver el aviso de actualización (pasos detallados en `sesiones/2026-10-02_03.md`).
- **Fases 3–5:** con banda de pulso, sensor de velocidad y rodillo reales (milestone «Pruebas con hardware real»).
