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

## Instalar y usar sin conexión

La app es una PWA: se instala como una aplicación y funciona sin conexión una vez cargada.

1. Abre la app en Chrome con conexión. Por ahora se prueba en el ordenador (Chrome en Windows); el móvil (Android) llega en la última fase.
2. Pulsa el icono de instalar en la barra de direcciones, o menú ⋮ → **Transmitir, guardar y compartir → Instalar página como aplicación**.
3. En **Ajustes**, importa tu `config/athlete.local.json`. Cada dispositivo guarda sus propios datos.

Sin conexión funciona todo: biblioteca, editor, player, contador de pulso, resumen e historial. La primera carga necesita red; después, la app entera (código, fuentes e iconos) queda guardada en el dispositivo.

Al pedir almacenamiento persistente, el navegador no borra tus sesiones ni el historial aunque le falte espacio. En **Ajustes → Datos en este dispositivo** puedes ver si lo ha concedido; con la app instalada suele concederlo.

**Actualizaciones:** cuando hay una versión nueva aparece el aviso «Nueva versión disponible» con el botón **Actualizar**. La app nunca se recarga sola, y el aviso no sale mientras haces una sesión o editas una.

## Despliegue

Cada push y cada PR ejecutan lint, tests y build en GitHub Actions (workflow `CI`).

Los push a `main` también publican la app en GitHub Pages (workflow `Deploy`), solo si lint, tests y build pasan. Si un push solo cambia `docs/` o archivos `.md`, no se vuelve a desplegar.

## Documentación

- [`docs/ROADMAP.md`](docs/ROADMAP.md): fases y tareas.
- [`CLAUDE.md`](CLAUDE.md): arquitectura, stack y convenciones.
- [`docs/reference/rodillo-pulso-v1.html`](docs/reference/rodillo-pulso-v1.html): versión 1 (un solo archivo), referencia funcional.
