// T11 · Capturas del manual (docs/manual/). Recorre la app con sensores simulados y el
// atleta de ejemplo, a 1280×900, y guarda un PNG por pantalla. Antes de las capturas del
// historial siembra sesiones inventadas (solo en el navegador de prueba) para que se vean
// la forma y la carga por semana.
// Uso: npm run build && npx vite preview --port 4173
//      OUT=docs/manual node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
// Después, comprimir los PNG (por ejemplo con pngquant) antes de subirlos.
const OUT = process.env.OUT ?? '.';

const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

const card = (page, title) =>
  page
    .locator('.sectionhead', { has: page.locator('h2', { hasText: title }) })
    .first()
    .locator('xpath=following-sibling::*[1]');

const shot = (target, name, opts = {}) =>
  target.screenshot({ path: `${OUT}/${name}.png`, ...opts });

async function finishSession(page) {
  await page.getByRole('button', { name: 'Terminar' }).click();
  await page.getByRole('button', { name: /Terminar\? Pulsa otra vez/ }).click();
}

async function seedHistory(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('rodillo-virtual');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('history', 'readwrite');
          const store = tx.objectStore('history');
          const zones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0, Z6: 0 };
          const day = 86_400_000;
          const now = Date.now();
          let i = 0;
          for (let d = 80; d >= 2; d--) {
            if ((d * 7) % 10 < 5) continue;
            const week = Math.floor((80 - d) / 7);
            const easy = week % 4 === 3;
            const minutes = (easy ? 40 : 50 + week * 2) + ((d * 13) % 15);
            const z2 = minutes * 60 * (easy ? 1 : 0.7);
            const z4 = minutes * 60 - z2;
            store.put({
              id: `ejemplo-${i++}`,
              dateMs: now - d * day,
              workoutName: easy ? 'Fondo Z2' : 'Umbral 3×10′',
              durationSec: minutes * 60,
              load: (z2 * 2 + z4 * 4) / 60,
              kcalEstimated: minutes * 9,
              plannedSecByZone: { ...zones, Z2: z2, Z4: z4 },
              actualSecByZone: { ...zones, Z2: z2, Z4: z4 },
              counts: [],
            });
          }
          tx.oncomplete = () => resolve(i);
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.install();
  await page.reload();
  await page.clock.runFor(1_500);

  // 1 · Sesiones
  await shot(page, '01-sesiones');

  // 2 · Ajustes: datos, zonas y rodillo (con el ejemplo y un rodillo de la lista)
  await tab(page, 'Ajustes').click();
  await page.locator('#trainer').selectOption({ index: 1 });
  await page.locator('#ftp').fill('200');
  await page.locator('#ftp').blur();
  await page.locator('#simulate').check();
  await shot(card(page, 'Tus datos'), '02-ajustes-datos');
  await shot(card(page, 'Zonas de pulso'), '03-ajustes-zonas');
  await shot(card(page, 'Rodillo y potencia'), '04-ajustes-rodillo');

  // 3 · Sensores simulados conectados
  await tab(page, 'Sensores').click();
  for (const b of await page.getByRole('button', { name: 'Conectar' }).all()) await b.click();
  await page.clock.runFor(3_000);
  await shot(page, '05-sensores', { fullPage: true });

  // 4 · Editor de sesiones
  await tab(page, 'Sesiones').click();
  await page.getByRole('button', { name: 'Nueva sesión' }).click();
  await page.clock.runFor(500);
  await shot(page, '06-editor');
  await page.locator('.sheet-top .btn.ghost').first().click();

  // 5 · Player por pulso, contador de 10″ y resumen
  await page.getByRole('button', { name: 'Empezar' }).first().click();
  await page.locator('.controls .btn.primary').click();
  await page.clock.runFor(420_000);
  await shot(page, '07-player');
  await page.getByRole('button', { name: 'Contar pulso' }).click();
  await page.clock.runFor(500);
  await shot(page, '08-contador');
  await page.getByRole('button', { name: 'Cerrar' }).click();
  await page.clock.runFor(500);
  await finishSession(page);
  await page.clock.runFor(1_000);
  // El resumen y el detalle son hojas por encima de la pantalla: captura de la ventana.
  await shot(page, '09-resumen');
  await page.locator('.sheet-top .btn.primary').first().click();

  // 6 · Rutas y vista 3D
  await tab(page, 'Rutas').click();
  await shot(page, '10-rutas');
  await page.getByRole('button', { name: 'Rodar' }).nth(1).click();
  await page.locator('.controls .btn.primary').click();
  // Avanzar el reloj con el 3D abierto pinta miles de fotogramas: se rueda en 2D y
  // se vuelve al 3D solo para la captura.
  await page.getByRole('button', { name: 'Vista 2D' }).click();
  await page.clock.runFor(150_000);
  await page.getByRole('button', { name: 'Vista 3D' }).click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  for (let i = 0; i < 20; i++) {
    await page.clock.runFor(100);
    await page.waitForTimeout(150);
  }
  await shot(page, '11-ruta-3d');
  await finishSession(page);
  await page.clock.runFor(1_000);
  await page.locator('.sheet-top .btn.primary').first().click();

  // 7 · Historial con forma (sesiones de ejemplo) y detalle de la salida
  const seeded = await seedHistory(page);
  await page.reload();
  await page.clock.runFor(1_500);
  await tab(page, 'Historial').click();
  await page.clock.runFor(1_000);
  await shot(page, '12-historial');
  await page.locator('tr.clickable').first().click();
  await page.locator('.session-chart svg').first().waitFor();
  await shot(page, '13-detalle');
  await page.locator('.session-chart').first().scrollIntoViewIfNeeded();
  const box = await page.locator('.session-chart .hit').first().boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await shot(page, '14-graficas');

  return { seeded };
}
