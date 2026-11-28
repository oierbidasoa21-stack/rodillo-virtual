// Fase 14 · CSP: recorre la app con la política activa (meta en el build y, en Docker,
// también las cabeceras) y cuenta las violaciones de CSP y los errores de la página.
// Cubre: sesiones, editor, player con sensores simulados, ruta con vista 3D, demo 3D,
// historial y la app sin conexión (service worker).
// Uso: npm run build && npx vite preview --port 4173   (o la imagen Docker en :8080)
//      node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const tab = (page, name) => page.getByRole('tab', { name }).first();

// «Terminar» needs two presses; with the 3D view busy, two separate clicks can
// arrive after the button has disarmed again, so press it twice in a row.
const finish = (page) => page.getByRole('button', { name: 'Terminar' }).dblclick();

export default async function run(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  await page.reload();
  await page.waitForTimeout(1500);

  await tab(page, 'Ajustes').click();
  await page.locator('#trainer').selectOption({ index: 1 });
  await page.locator('#simulate').check();
  await tab(page, 'Sensores').click();
  for (const b of await page.getByRole('button', { name: 'Conectar' }).all()) await b.click();
  await page.waitForTimeout(1500);

  await tab(page, 'Sesiones').click();
  await page.getByRole('button', { name: 'Nueva sesión' }).click();
  await page.locator('.sheet-top .btn.ghost').first().click();
  await page.getByRole('button', { name: 'Empezar' }).first().click();
  await page.locator('.controls .btn.primary').click();
  await page.waitForTimeout(3000);
  await finish(page);
  await page.locator('.sheet-top .btn.primary').first().click();

  await tab(page, 'Rutas').click();
  await page.getByRole('button', { name: 'Rodar' }).first().click();
  await page.locator('.controls .btn.primary').click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(4000);
  await finish(page);
  await page.locator('.sheet-top .btn.primary').first().click();

  await tab(page, 'Historial').click();
  await page.waitForTimeout(500);

  const sw = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state);
  await page.context().setOffline(true);
  await page.reload();
  await tab(page, 'Rutas').click();
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);
  await page.context().setOffline(false);

  const csp = await page.evaluate(() => window.__csp);
  return { csp, errors, sw };
}
