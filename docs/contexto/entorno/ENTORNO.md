# Entorno

## Repositorio y despliegue

- **Repo:** https://github.com/oierbidasoa21-stack/rodillo-virtual (público).
- **App publicada:** https://oierbidasoa21-stack.github.io/rodillo-virtual/
- **Workflows:** `CI` (lint, tests y build en cada push y PR) y `Deploy` (solo en `main`, se salta si el push solo toca `docs/**` o `*.md`).
- **Ramas:** una por fase o cambio (`feat/…`, `docs/…`, `ci/…`). Claude hace push y fast-forward a `main` por su cuenta cuando lint, tests y build pasan y lo hecho está comprobado (autorizado el 2026-11-25), y vigila CI y Deploy.
- **Milestones e issues:** un milestone por fase (0–8; el 9, móvil, cerrado por descartado) y «Pruebas con hardware real». Las tareas pendientes son issues.

## Herramientas

- Node 24 (`.nvmrc`), npm 11. Vite 8, React 19, TypeScript 6.0 (fijado: typescript-eslint no admite TS 7), Vitest 5, ESLint 10, Prettier.
- Dependencias de la app: `react`, `react-dom`, `zustand`, `dexie`, `@fontsource/barlow(-condensed)`. Desarrollo: `vite-plugin-pwa`, `fake-indexeddb`, `@types/web-bluetooth`, y el resto de herramientas de lint/test.
- `gh` con sesión en la cuenta `oierbidasoa21-stack`.

## Problemas del entorno ya resueltos

- **Tests que fallan todos sin ejecutar nada** (`Cannot read properties of undefined (reading 'config')`): la carpeta se abrió como `c:\…` en minúscula. Vitest carga entonces sus módulos dos veces. Solución: lanzar los comandos desde `C:\Users\oierf\Documents\Trabajos\zwift`, con la `C` mayúscula (en PowerShell: `Set-Location -LiteralPath 'C:\Users\…\zwift'`).
- **Avisos LF/CRLF**: `.gitattributes` fuerza `eol=lf` para que Prettier no marque todos los archivos.
- **`git push` «Repository not found»** (al principio): el repo no existía y `gh` estaba en otra cuenta. Se creó en `oierbidasoa21-stack`.
- **Scripts de bash con comillas invertidas**: en scripts `node -e "…"` dentro de bash, las comillas invertidas se interpretan; para ediciones con plantillas de texto usar la herramienta de edición.

## Datos personales

- `config/athlete.local.json` (ignorado por git): peso, peso de la bici, rueda, zonas. **No copiar sus valores** a código, tests, docs ni commits.
- `data/` (ignorado): GPX propios, exportaciones, copias de seguridad.
