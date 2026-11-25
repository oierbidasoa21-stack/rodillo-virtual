# Scripts de prueba en navegador

Scripts para la skill `browser-automation` de Claude Code (Chrome sin ventana con patchright). Cada uno exporta `async (page, ui) => resultado` y se lanza así:

```sh
node <carpeta-de-la-skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script docs/contexto/pruebas/scripts/<script>.mjs
```

con `npm run build && npm run preview` en marcha, o contra la web publicada.

Convenciones:

- Nombre `fase-N-<qué-comprueba>.mjs`.
- Rutas de archivos temporales (capturas, GPX de prueba) relativas a una carpeta que reciba el script, nunca rutas personales.
- Sin datos personales: usar los valores de `config/athlete.example.json` y sensores simulados.

Los scripts de las fases 0–5 se perdieron (estaban en una carpeta temporal). Lo que comprobaba cada uno está en [`../PRUEBAS.md`](../PRUEBAS.md).
