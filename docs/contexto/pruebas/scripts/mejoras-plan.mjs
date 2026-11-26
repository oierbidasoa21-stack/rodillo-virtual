// Mejoras: plan del entrenador. Importa un plan con errores (se rechaza y se explican),
// luego uno válido (hoy, mañana y un descanso, envuelto en texto como lo escribiría el
// agente), comprueba la lista y que «Empezar» abre la sesión de hoy.
// Uso: SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

const iso = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await tab(page, 'Sesiones').click();
  const card = page.locator('.plan-card');
  await card.waitFor();

  await card.getByRole('button', { name: 'Importar plan' }).click();
  await card.locator('textarea').fill('{"dias":[{"fecha":"mañana","bloques":[]}]}');
  await card.getByRole('button', { name: 'Importar', exact: true }).click();
  const errors = await card.locator('.msg.error').innerText();

  const plan = {
    formato: 'rodillo-virtual/plan@1',
    nombre: 'Semana de prueba',
    dias: [
      {
        fecha: iso(0),
        titulo: 'Umbral 4×6',
        notas: 'Cadencia 90',
        bloques: [
          { tipo: 'calentamiento', min: 12, zona: 'L1' },
          {
            repetir: 4,
            bloques: [
              { tipo: 'serie', min: 6, zona: 'UA' },
              { tipo: 'recuperacion', min: 3, zona: 'L1' },
            ],
          },
          { tipo: 'vuelta', min: 8, zona: 'L1' },
        ],
      },
      { fecha: iso(1), descanso: true, notas: 'Descanso' },
      { fecha: iso(2), titulo: 'Fondo L2', bloques: [{ min: 75, zona: 'L2' }] },
    ],
  };
  await card
    .locator('textarea')
    .fill(`Aquí tienes la semana:\n\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n`);
  await card.getByRole('button', { name: 'Importar', exact: true }).click();
  await card.locator('.plan-days li').first().waitFor();
  const days = await card.locator('.plan-days').innerText();
  await card.screenshot({ path: process.env.SHOT ?? 'plan.png' });

  await card.locator('.plan-days li.today').getByRole('button', { name: 'Empezar' }).click();
  await page.waitForTimeout(800);
  const player = await page.locator('.overlay h2, .sheet h2').first().innerText();
  return { errors, days, player };
}
