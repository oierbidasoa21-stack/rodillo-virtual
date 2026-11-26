// Mejoras: fantasma. Siembra una salida guardada en el Puerto (historial + grabación a
// 7,5 m/s, inventada y solo en el navegador de prueba), abre la demo en esa ruta y
// comprueba que aparece el fantasma con su diferencia.
// Uso: SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(1500);
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('rodillo-virtual');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['history', 'recordings'], 'readwrite');
          const zones = { L1: 0, L2: 0, L3: 0, UA: 0, 'UA+': 0, VO2: 0 };
          const dateMs = Date.now() - 5 * 86_400_000;
          const secs = 1200;
          tx.objectStore('history').put({
            id: 'ghost-seed',
            dateMs,
            workoutName: 'Puerto',
            durationSec: secs,
            load: 60,
            kcalEstimated: 300,
            plannedSecByZone: zones,
            actualSecByZone: zones,
            counts: [],
            ride: {
              routeId: 'ej-puerto',
              routeName: 'Puerto de la Sierra Imaginaria',
              distanceM: secs * 7.5,
              ascentM: 300,
              avgSpeedKmh: 27,
              mode: 'wheel',
              laps: 0,
            },
          });
          const samples = Array.from({ length: secs }, (_, t) => ({
            t,
            hr: null,
            powerW: null,
            speedKmh: 27,
            cadenceRpm: null,
            distanceM: t * 7.5,
            altitudeM: null,
            lat: null,
            lon: null,
          }));
          tx.objectStore('recordings').put({ sessionId: 'ghost-seed', startMs: dateMs, samples });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();
  await tab(page, 'Rutas').click();
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  await page.locator('.ghost-chip').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(15_000);
  const chip = await page.locator('.ghost-chip').innerText();
  await page.screenshot({ path: process.env.SHOT ?? 'fantasma.png' });
  return { chip };
}
