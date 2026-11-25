# Fase 0 — Base del proyecto ✅

**Fechas:** 2026-10-02 · **Ramas:** `chore/phase-0-setup`, `docs/phase-0-done`, `ci/skip-deploy-on-docs` · **Milestone:** Fase 0 (cerrado)

## Objetivo

Repositorio limpio, herramientas configuradas y despliegue automático. Hecho cuando la página vacía se abre desde GitHub Pages y el workflow pasa en verde.

## Qué se hizo

- Vite + React + TypeScript `strict` (montado a mano, la carpeta no estaba vacía).
- ESLint (flat config) + Prettier; regla que **prohíbe a `src/domain/` importar React o capas de la app**.
- Vitest con un test de ejemplo; estructura de carpetas de `CLAUDE.md`.
- `.gitignore` (`node_modules/`, `dist/`, `data/`, `config/*.local.json`), `.gitattributes` con LF, `.nvmrc`.
- Datos personales movidos a `config/athlete.local.json` con `athlete.example.json` versionado.
- Workflows `CI` y `Deploy` (este último con `paths-ignore` para documentación).
- `base: '/rodillo-virtual/'` en Vite (GitHub Pages sirve bajo `/<repo>/`).

## Comprobación

Lint, tests y build en local; la página publicada carga (200, sin errores en consola).

## Desviaciones y notas

- TypeScript fijado en `~6.0` porque typescript-eslint no admite TS 7.
- El usuario decidió hacer el repo público y no reescribir el historial pese a que contiene datos personales antiguos.
