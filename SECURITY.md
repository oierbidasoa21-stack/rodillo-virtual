# Seguridad

## Cómo avisar de un fallo de seguridad

**No abras un issue público.** Usa el aviso privado de GitHub:

1. Pestaña **Security** del repositorio → **Report a vulnerability**.
2. Explica el fallo, cómo reproducirlo y qué impacto tiene.

Solo lo ven el titular y tú. Recibirás respuesta en unos 7 días. Cuando haya arreglo, se publica con el aviso y, si quieres, con tu nombre.

## Versiones con soporte

Solo la última versión publicada en GitHub Pages (rama `main`). No hay versiones antiguas con soporte.

## Qué tiene en cuenta el proyecto

- **No hay servidor ni cuentas**: los datos se guardan solo en el navegador del usuario (IndexedDB). La app no envía nada a ningún sitio.
- **Sin secretos en el repo**: no hacen falta.
- **Datos personales fuera del repo**: `config/athlete.local.json` y `data/` están en `.gitignore`.
- **Sensores**: Web Bluetooth solo funciona con HTTPS o en `localhost`, y Chrome pide permiso para cada sensor.
- **Archivos que importa el usuario** (GPX, `.zwo`, copia de seguridad, plan del entrenador): se validan antes de guardarlos y, si algo no encaja, no se importa nada.
- **Dependencias**: Dependabot avisa de las que tienen fallos conocidos y las actualiza. En cada PR, CodeQL revisa el código y `npm audit` falla si una dependencia de producción tiene un fallo alto o crítico.
- **Cabeceras y CSP**: la app solo carga código, estilos y datos de su propio origen (sin `unsafe-inline` ni `unsafe-eval`). En Docker van como cabeceras HTTP y en GitHub Pages, en una `<meta>`. Permissions-Policy solo deja Bluetooth, mantener la pantalla encendida y pantalla completa.
- **Imagen Docker**: nginx sin root, sistema de archivos de solo lectura, sin capacidades de Linux, imágenes base fijadas por digest y parches de Alpine aplicados al construir. Trivy la escanea en cada PR.
- **Versiones publicadas**: cada imagen en GHCR lleva su SBOM y su procedencia, y va firmada con cosign. Cómo comprobar la firma: [`docs/despliegue/`](docs/despliegue/README.md#versiones-e-imagen-en-ghcr).

## Fuera de alcance

- Fallos que necesitan acceso físico al ordenador del usuario o a su navegador ya abierto.
- Fallos de Chrome, de Web Bluetooth o de los propios sensores.
