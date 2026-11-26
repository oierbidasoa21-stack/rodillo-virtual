// Mejoras: avisos de voz en ruta. Intercepta la síntesis de voz, abre la demo del
// Rompepiernas y espera a que avise de una subida (300 m antes) y de la cima.
// El navegador de pruebas evalúa en un contexto aislado: la interceptación se inyecta
// con una etiqueta <script> (contexto de la página) y lo dicho se guarda en un atributo.
// Uso: node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
const tab = (page, name) =>
  page
    .getByRole('tab', { name })
    .or(page.getByRole('button', { name, exact: true }))
    .first();

const said = (page) =>
  page.evaluate(() => JSON.parse(document.documentElement.dataset.said ?? '[]'));

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addScriptTag({
    content: `
      window.speechSynthesis.cancel = () => {};
      window.speechSynthesis.speak = (u) => {
        const list = JSON.parse(document.documentElement.dataset.said || '[]');
        list.push(u.text);
        document.documentElement.dataset.said = JSON.stringify(list);
      };`,
  });
  await tab(page, 'Rutas').click();
  await page.getByLabel('Ruta de la demo').selectOption({ label: 'Rompepiernas del Valle' });
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  for (let i = 0; i < 300; i++) {
    await page.waitForTimeout(1000);
    if ((await said(page)).some((t) => t.startsWith('Cima'))) break;
  }
  const distance = await page.locator('.world-hud').innerText();
  return { said: await said(page), hud: distance.replace(/\n/g, ' ') };
}
