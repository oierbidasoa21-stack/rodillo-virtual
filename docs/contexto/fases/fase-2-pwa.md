# Fase 2 — PWA ✅ (falta la prueba del usuario)

**Fechas:** 2026-10-02 · **Ramas:** `feat/pwa`, `docs/desktop-first` · **Milestone:** Fase 2 (cerrado)

## Objetivo

Instalar la app y usarla sin conexión una vez cargada. Hecho cuando se instala desde Chrome en Windows, se abre sin conexión y se puede hacer una sesión completa.

## Qué se hizo

- Iconos propios (barras con los colores de zona): normal, maskable y Apple.
- `vite-plugin-pwa`: manifest (`scope` y `start_url` en `/rodillo-virtual/`) y service worker que precarga toda la app (22 entradas, solo fuentes latinas).
- **Aviso «Nueva versión disponible»** que nunca recarga solo y espera si hay una sesión o el editor abierto.
- Petición de **almacenamiento persistente** y su estado en Ajustes.
- Documentación de instalación y uso sin conexión.

## Cambio de enfoque durante la fase

El usuario decidió probar **solo en el ordenador (Chrome en Windows)** y pasar el móvil a una fase final (Fase 9). Se actualizaron `CLAUDE.md`, el roadmap y el README. También se corrigieron dos casillas de fases futuras marcadas por error.

## Comprobación

En headless: manifest e iconos, service worker activo, sesión entera **sin conexión** (local y publicada) y flujo de actualización (con player y editor abiertos no aparece; al salir sí; «Actualizar» recarga a la versión nueva).

## Pendiente

Prueba del usuario en su Chrome: instalar, abrir sin conexión y ver el aviso de actualización. Se cerró la fase sin ella por decisión del usuario.
