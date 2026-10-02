# Rodillo Virtual

Aplicación web de entrenamiento en rodillo para uso personal: workouts estructurados por pulso, métricas en directo y, más adelante, rutas virtuales con pendiente y un mundo 3D.

Todo corre en el navegador y los datos se quedan en el dispositivo. No hay backend ni cuentas.

**App:** https://oierbidasoa21-stack.github.io/rodillo-virtual/

## Requisitos

- Node.js 24 (ver `.nvmrc`)
- Chrome (ordenador o Android) para los sensores Bluetooth. Web Bluetooth necesita HTTPS o `localhost`.

## Comandos

```sh
npm install       # instalar dependencias
npm run dev       # servidor local en localhost
npm run test      # tests (Vitest)
npm run lint      # ESLint + comprobación de formato con Prettier
npm run format    # formatear con Prettier
npm run build     # build de producción en dist/
npm run preview   # servir el build en local
```

## Configuración del atleta

Los datos personales (peso y zonas de pulso) no se suben al repositorio. Copia el ejemplo y edítalo:

```sh
cp config/athlete.example.json config/athlete.local.json
```

`config/athlete.local.json` está en `.gitignore`.

## Despliegue

Cada push a `main` ejecuta lint, tests y build en GitHub Actions. Si todo pasa, se publica en GitHub Pages.

## Documentación

- [`docs/ROADMAP.md`](docs/ROADMAP.md): fases y tareas.
- [`CLAUDE.md`](CLAUDE.md): arquitectura, stack y convenciones.
- [`docs/reference/rodillo-pulso-v1.html`](docs/reference/rodillo-pulso-v1.html): versión 1 (un solo archivo), referencia funcional.
