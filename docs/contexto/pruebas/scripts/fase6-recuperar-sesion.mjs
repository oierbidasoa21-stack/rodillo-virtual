// Fase 6 · bloque A: la sesión en curso se guarda, sobrevive a una recarga y se
// puede retomar o guardar con su grabación.
// Uso: npm run build && npx vite preview --port 4173
//      node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const idb = (page, store) =>
  page.evaluate(
    (store) =>
      new Promise((resolve) => {
        const req = indexedDB.open('rodillo-virtual');
        req.onsuccess = () => {
          const tx = req.result.transaction(store, 'readonly');
          const all = tx.objectStore(store).getAll();
          all.onsuccess = () => resolve(all.result);
        };
      }),
    store,
  );

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.install();
  await page.reload();
  await page.getByRole('tab', { name: 'Ajustes' }).or(page.getByRole('button', { name: 'Ajustes' })).first().click();
  await page.locator('#simulate').check();
  await page.getByRole('tab', { name: 'Sensores' }).or(page.getByRole('button', { name: 'Sensores' })).first().click();
  for (const b of await page.getByRole('button', { name: 'Conectar' }).all()) await b.click();
  await page.clock.runFor(3_000);
  await page.getByRole('tab', { name: 'Sesiones' }).or(page.getByRole('button', { name: /Sesiones|Biblioteca/ })).first().click();
  await page.getByRole('button', { name: 'Empezar' }).first().click();
  await page.waitForTimeout(300);
  // Possible route chooser: start without a route.
  const noRoute = page.getByRole('button', { name: /Sin ruta|Empezar sin ruta/ });
  if (await noRoute.count()) await noRoute.first().click();
  await page.locator('.controls .btn.primary').click(); // Empezar
  await page.clock.runFor(95_000);
  const name = await page.locator('.sheet-top h2').innerText();
  const saved = await idb(page, 'inProgress');
  const before = { name, samples: saved[0]?.recorder.recording.samples.length, kind: saved[0]?.kind };

  await page.reload();
  await page.locator('.resume-banner').waitFor();
  const banner = await page.locator('.resume-banner').innerText();
  await page.screenshot({ path: process.env.SHOT ?? 'resume-banner.png' });
  await page.getByRole('button', { name: 'Retomar' }).click();
  const resumedLabel = await page.locator('.controls .btn.primary').innerText();
  await page.locator('.controls .btn.primary').click(); // Reanudar
  await page.clock.runFor(10_000);
  await page.getByRole('button', { name: 'Terminar' }).click();
  await page.getByRole('button', { name: /Terminar\? Pulsa otra vez/ }).click();
  await page.waitForTimeout(500);
  const history = await idb(page, 'history');
  const recordings = await idb(page, 'recordings');
  const left = await idb(page, 'inProgress');
  return {
    before,
    banner,
    resumedLabel,
    historyCount: history.length,
    durationSec: history[0]?.durationSec,
    recordingSamples: recordings[0]?.samples.length,
    firstSample: recordings[0]?.samples[0],
    midSample: recordings[0]?.samples[60],
    simulatedFlags: history[0]?.hrMeasured?.simulated,
    sameId: history[0]?.id === recordings[0]?.sessionId,
    inProgressLeft: left.length,
  };
}
