// Fase 6 · bloque B: una salida por ruta con sensores simulados y curva de rodillo;
// en Historial se abre su detalle con gráficas, se exporta el TCX y se borra.
// Uso: npm run build && npx vite preview --port 4173
//      SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
import { readFileSync } from 'node:fs';

const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.install();
  await page.reload();
  await tab(page, 'Ajustes').click();
  await page.locator('#simulate').check();
  await page.locator('#trainer').selectOption({ index: 1 });
  await tab(page, 'Sensores').click();
  for (const b of await page.getByRole('button', { name: 'Conectar' }).all()) await b.click();
  await page.clock.runFor(3_000);

  await tab(page, 'Rutas').click();
  await page.getByRole('button', { name: 'Rodar' }).first().click();
  await page.locator('.controls .btn.primary').click();
  await page.clock.runFor(240_000);
  await page.getByRole('button', { name: 'Terminar' }).click();
  await page.getByRole('button', { name: /Terminar\? Pulsa otra vez/ }).click();
  await page.getByRole('button', { name: 'Volver a sesiones' }).click();

  await tab(page, 'Historial').click();
  await page.locator('tr.clickable').first().click();
  await page.locator('.session-chart svg').first().waitFor();
  const titles = await page.locator('.session-chart .tag').allInnerTexts();
  const box = await page.locator('.session-chart .hit').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const readout = await page.locator('.readout').innerText();
  await page.screenshot({ path: process.env.SHOT ?? 'detalle.png', fullPage: true });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar TCX' }).click(),
  ]);
  const tcx = readFileSync(await download.path(), 'utf8');

  await page.getByRole('button', { name: 'Borrar sesión' }).click();
  await page.getByRole('button', { name: /Seguro/ }).click();
  const rowsLeft = await page.locator('tr.clickable').count();
  return {
    titles,
    readout,
    file: download.suggestedFilename(),
    trackpoints: tcx.match(/<Trackpoint>/g)?.length,
    hasWatts: tcx.includes('<ns3:Watts>'),
    hasPosition: tcx.includes('<LatitudeDegrees>'),
    notes: tcx.match(/<Notes>(.*)<\/Notes>/)?.[1],
    rowsLeft,
  };
}
