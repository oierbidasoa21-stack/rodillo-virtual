// Mejoras: pantalla completa. En la demo 3D: botón → pantalla completa (captura), tecla F →
// sale. En el reproductor de una sesión: tecla F → pantalla completa.
// Uso: SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
import os from 'node:os';

const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();
const isFull = (page) => page.evaluate(() => document.fullscreenElement?.className ?? null);

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await tab(page, 'Rutas').click();
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Pantalla completa' }).click();
  await page.waitForTimeout(2500);
  const rideFull = await isFull(page);
  const stageH = await page.locator('.world-stage').evaluate((e) => e.clientHeight);
  await page.screenshot({ path: process.env.SHOT ?? `${os.tmpdir()}/pantalla-completa.png` });
  await page.keyboard.press('f');
  await page.waitForTimeout(800);
  const rideAfterF = await isFull(page);
  await page.getByRole('button', { name: 'Salir de la demo' }).click();

  await tab(page, 'Sesiones').click();
  await page.getByRole('button', { name: 'Empezar' }).first().click();
  await page.waitForTimeout(800);
  await page.keyboard.press('f');
  await page.waitForTimeout(800);
  const playerFull = await isFull(page);
  return { rideFull, stageH, rideAfterF, playerFull };
}
