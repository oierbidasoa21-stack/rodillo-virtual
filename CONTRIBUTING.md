# Cómo contribuir

Rodillo Virtual es un proyecto **personal**: lo usa una sola persona y el código tiene **todos los derechos reservados** (ver [`LICENSE`](LICENSE)). Puedes leerlo, abrir issues y proponer cambios, pero cualquier contribución se acepta solo si el titular quiere, y no da derechos sobre el proyecto.

## Antes de empezar

- Lee [`CLAUDE.md`](CLAUDE.md): reglas del proyecto, arquitectura y convenciones.
- Mira la fase actual en [`docs/ROADMAP.md`](docs/ROADMAP.md). Solo se trabaja en la fase actual.
- Para usar la app, [`docs/MANUAL.md`](docs/MANUAL.md); para orientarte en el código, [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md).

## Issues

- **Error:** usa la plantilla «Error». Di qué hiciste, qué esperabas y qué pasó, con la versión de Chrome.
- **Mejora o tarea:** usa su plantilla. Una idea por issue.
- **Fallos de seguridad:** nunca en un issue público. Sigue [`SECURITY.md`](SECURITY.md).
- No pegues datos personales (peso, zonas, entrenamientos, GPX propios).

## Forma de trabajar

1. **Una rama por issue**, desde `main` al día: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
2. **Commits con [Conventional Commits](https://www.conventionalcommits.org/es/)**, en inglés: `feat(workout): add repeat blocks`, `fix(sensors): handle HR disconnect`. Uno por cambio lógico.
3. Antes de cada commit, en verde:

   ```sh
   npm run lint
   npm run test
   npm run build
   ```

4. **Pull request a `main`** con la plantilla rellena y `Closes #n` para cerrar su issue. Nada se sube directo a `main`: CI tiene que pasar y alguien lo revisa antes de fusionar.
5. Si cambia algo que se ve o se usa en la app, actualiza el manual y sus capturas (regla 10 de `CLAUDE.md`).

## Estilo

- TypeScript en modo `strict`, ESLint y Prettier (`npm run format` lo arregla).
- Código, identificadores y commits en inglés; textos de la interfaz y documentación en español.
- La lógica pura va en `src/domain/`, sin React ni APIs del navegador, y siempre con tests.
- La app nunca inventa datos: si falta un sensor, la métrica que depende de él no se muestra.

## Datos personales

Nunca subas datos personales: `config/athlete.local.json` y la carpeta `data/` están en `.gitignore` por eso. Las capturas y los ejemplos usan sensores simulados y `config/athlete.example.json`.
