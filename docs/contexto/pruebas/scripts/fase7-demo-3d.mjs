// Fase 7: la demo 3D carga el mundo, el ciclista avanza solo, se miden los fotogramas
// por segundo y se cambia a la vista 2D y vuelta. No debe guardar nada.
// ROUTE=<nombre> elige la ruta de la demo (por defecto, el puerto).
// Uso: npm run build && npx vite preview --port 4173
//      SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await tab(page, 'Rutas').click();
  if (process.env.ROUTE) {
    await page.getByLabel('Ruta de la demo').selectOption({ label: process.env.ROUTE });
  }
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(6000);

  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        const step = () => {
          frames++;
          if (performance.now() - start < 3000) requestAnimationFrame(step);
          else resolve(Math.round((frames / (performance.now() - start)) * 1000));
        };
        requestAnimationFrame(step);
      }),
  );
  const hud = await page.locator('.world-hud').innerText();
  const badge = await page.locator('.mode-demo').innerText();
  await page.screenshot({ path: process.env.SHOT ?? 'demo3d.png' });
  if (process.env.SHOT2) {
    await page.waitForTimeout(25_000);
    await page.screenshot({ path: process.env.SHOT2 });
  }

  await page.getByRole('button', { name: 'Vista 2D' }).click();
  const has2d = await page.locator('.minimap').count();
  const canvasIn2d = await page.locator('canvas').count();
  await page.getByRole('button', { name: 'Vista 3D' }).click();
  await page.locator('canvas').waitFor();
  await page.getByRole('button', { name: 'Salir de la demo' }).click();

  const stored = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open('rodillo-virtual');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(['history', 'inProgress'], 'readonly');
          const h = tx.objectStore('history').count();
          const p = tx.objectStore('inProgress').count();
          tx.oncomplete = () => resolve({ history: h.result, inProgress: p.result });
        };
      }),
  );
  return { fps, badge, hud: hud.replace(/\n+/g, ' · '), has2d, canvasIn2d, stored };
}
