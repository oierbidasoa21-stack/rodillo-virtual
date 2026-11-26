// Mejoras: panel de Forma en Historial. Siembra ~60 sesiones de ejemplo (inventadas, solo
// en el navegador de prueba) en IndexedDB, recarga y comprueba el panel.
// Uso: SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.waitForTimeout(1500);
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('rodillo-virtual');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('history', 'readwrite');
          const store = tx.objectStore('history');
          const zones = { L1: 0, L2: 0, L3: 0, UA: 0, 'UA+': 0, VO2: 0 };
          const day = 86_400_000;
          const now = Date.now();
          let i = 0;
          for (let d = 95; d >= 1; d--) {
            // 4–5 sessions a week, building up, with a lighter week every fourth.
            if ((d * 7) % 10 < 4) continue;
            const week = Math.floor((95 - d) / 7);
            const easy = week % 4 === 3;
            const minutes = (easy ? 40 : 50 + week * 3) + ((d * 13) % 20);
            const load = minutes * (easy ? 1.8 : 2.4 + ((d * 7) % 5) * 0.2);
            store.put({
              id: `seed-${i++}`,
              dateMs: now - d * day,
              workoutName: easy ? 'Rodaje suave' : 'Series en UA',
              durationSec: minutes * 60,
              load,
              kcalEstimated: minutes * 9,
              plannedSecByZone: { ...zones, L2: minutes * 60 },
              actualSecByZone: { ...zones, L2: minutes * 60 },
              counts: [],
            });
          }
          tx.oncomplete = () => resolve(i);
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();
  await tab(page, 'Historial').click();
  await page.locator('.fitness-panel').waitFor({ timeout: 10_000 });
  const tiles = await page.locator('.fitness-tiles').innerText();
  const level = await page.locator('.fitness-level').innerText();
  // Hover a point of the curve to check the readout follows it.
  const hit = page.locator('.fitness-chart .hit');
  const box = await hit.boundingBox();
  if (box) await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  const readout = await page.locator('.fitness-chart .readout').innerText();
  await page.locator('.fitness-panel').screenshot({ path: process.env.SHOT ?? 'forma.png' });
  return { tiles, level, readout };
}
