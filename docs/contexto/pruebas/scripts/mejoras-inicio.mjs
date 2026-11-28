// Fase 15a · Panel de inicio (#55). Abre la app vacía (Inicio por defecto), siembra
// sesiones inventadas (solo en el navegador de prueba) e importa un plan de ejemplo con
// hoy y pasado mañana, y comprueba las tres tarjetas.
// Uso: npm run build && npx vite preview --port 4173
//      OUT=<carpeta> node <runner> http://localhost:4173/rodillo-virtual/ <este archivo>
const OUT = process.env.OUT ?? '.';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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
          for (let d = 60; d >= 0; d--) {
            if ((d * 7) % 10 < 5) continue;
            const minutes = 45 + ((d * 13) % 30);
            const z2 = minutes * 60 * 0.7;
            const z4 = minutes * 60 - z2;
            store.put({
              id: `ejemplo-${i++}`,
              dateMs: now - d * day - 3_600_000,
              workoutName: 'Umbral 3×10′',
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
  await page.reload();
  await page.locator('.home').waitFor();
  const selected = await page.getByRole('tab', { selected: true }).textContent();
  await page.screenshot({ path: `${OUT}/inicio-vacio.png` });
  const emptyText = await page.locator('.home').innerText();

  const seeded = await seedHistory(page);
  await page.reload();
  await page.getByRole('tab', { name: 'Sesiones' }).click();
  await page.getByRole('button', { name: 'Importar plan' }).click();
  const now = Date.now();
  const plan = {
    formato: 'rodillo-virtual/plan@1',
    nombre: 'Semana de prueba',
    dias: [
      {
        fecha: ymd(now),
        titulo: 'Umbral 4×6′',
        notas: 'Cadencia alta en las series.',
        bloques: [
          { tipo: 'calentamiento', min: 10, zona: 'Z1' },
          {
            repetir: 4,
            bloques: [
              { tipo: 'serie', min: 6, zona: 'Z4' },
              { tipo: 'recuperacion', min: 3, zona: 'Z1' },
            ],
          },
          { tipo: 'vuelta', min: 10, zona: 'Z1' },
        ],
      },
      { fecha: ymd(now + 86_400_000), descanso: true },
      { fecha: ymd(now + 2 * 86_400_000), titulo: 'Fondo', bloques: [{ min: 75, zona: 'Z2' }] },
    ],
  };
  await page.locator('#plan-text').fill(JSON.stringify(plan));
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.locator('.home-next .profile').waitFor();
  await page.screenshot({ path: `${OUT}/inicio.png` });
  const text = await page.locator('.home').innerText();
  const bars = await page
    .locator('.week-bar i')
    .evaluateAll((els) => els.map((e) => e.style.height));
  return { selected, emptyText, seeded, text, bars };
}
