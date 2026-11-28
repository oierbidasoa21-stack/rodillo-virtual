// Fase 10 · teselas y CSP (#23). Con la build y su CSP, desde la propia página:
// - descarga una tesela de relieve (AWS Terrain Tiles) y una de satélite (EOX);
// - decodifica el relieve como src/tiles/decode.ts (sin conversión de color ni
//   alfa premultiplicado) y da la altura de un píxel;
// - las guarda en Cache Storage y las vuelve a leer;
// - comprueba que otro origen (OpenStreetMap) sigue bloqueado por la CSP.
// Necesita conexión. Uso: npm run build && npx vite preview --port 4173
//      node <runner> http://localhost:4173/rodillo-virtual/ <este archivo>
export default async function run(page) {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  await page.reload();
  await page.waitForTimeout(1000);
  return page.evaluate(async () => {
    // Tile of an invented point in a mountain area (no real route).
    const terrainUrl = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/12/2048/1510.png';
    const imageryUrl =
      'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/14/6042/8194.jpg';
    const out = {};
    const t = await fetch(terrainUrl);
    const tBlob = await t.blob();
    const bmp = await createImageBitmap(tBlob, {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
    const c = new OffscreenCanvas(256, 256).getContext('2d', { willReadFrequently: true });
    c.drawImage(bmp, 0, 0);
    const px = c.getImageData(0, 0, 256, 256).data;
    const h = (i) => px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 256 * 256; i++) {
      min = Math.min(min, h(i));
      max = Math.max(max, h(i));
    }
    out.terrain = {
      status: t.status,
      bytes: tBlob.size,
      size: `${bmp.width}×${bmp.height}`,
      minM: Math.round(min),
      maxM: Math.round(max),
    };
    const im = await fetch(imageryUrl);
    out.imagery = { status: im.status, bytes: (await im.blob()).size };
    const cache = await caches.open('rodillo-virtual-tiles-prueba');
    await cache.put(terrainUrl, new Response(tBlob));
    out.cached = !!(await cache.match(terrainUrl));
    await caches.delete('rodillo-virtual-tiles-prueba');
    try {
      await fetch('https://tile.openstreetmap.org/0/0/0.png');
      out.otherOrigin = 'NO BLOQUEADO';
    } catch {
      out.otherOrigin = 'bloqueado';
    }
    await new Promise((r) => setTimeout(r, 200));
    out.csp = window.__csp;
    return out;
  });
}
