// Fase 6 · bloque C: exportar una sesión de la biblioteca a .zwo, importarla de
// nuevo y que quede igual; importar un .zwo con rampa (avisos) y uno roto (error).
// Uso: npm run build && npx vite preview --port 4173
//      SHOT=<png> node <skill>/browser.mjs http://localhost:4173/rodillo-virtual/ --script <este archivo>
import { readFileSync } from 'node:fs';

const RAMP = `<workout_file><name>Rampa de prueba</name><workout>
<Warmup Duration="180" PowerLow="0.4" PowerHigh="0.7"/>
<SteadyState Duration="300" Power="0.9"/></workout></workout_file>`;

export default async function run(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  const card = page.locator('article.card', { hasText: 'Umbral' }).first();
  const builtinName = await card.locator('h3').innerText();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    card.getByRole('button', { name: 'Exportar .zwo' }).click(),
  ]);
  const xml = readFileSync(await download.path(), 'utf8');
  const toast = await page
    .locator('.toast')
    .innerText()
    .catch(() => null);

  const input = page.locator('input[type=file][accept*=".zwo"]');
  await input.setInputFiles({
    name: 'a.zwo',
    mimeType: 'application/xml',
    buffer: Buffer.from(xml),
  });
  await page.waitForTimeout(300);
  await input.setInputFiles({
    name: 'b.zwo',
    mimeType: 'application/xml',
    buffer: Buffer.from(RAMP),
  });
  await page.waitForTimeout(300);
  const warn = await page.locator('.msg').first().innerText();
  await page.screenshot({ path: process.env.SHOT ?? 'zwo.png' });
  await input.setInputFiles({
    name: 'c.zwo',
    mimeType: 'application/xml',
    buffer: Buffer.from('<html></html>'),
  });
  await page.waitForTimeout(300);
  const error = await page.locator('.msg.error').innerText();

  const mine = await page.locator('article.card h3').allInnerTexts();
  const mineDur = await page.locator('article.card .dur').allInnerTexts();
  return {
    file: download.suggestedFilename(),
    builtinName,
    toast,
    firstLines: xml.split('\n').slice(0, 8),
    warn,
    error,
    cards: mine.slice(0, 3).map((n, i) => `${n} · ${mineDur[i]}`),
  };
}
