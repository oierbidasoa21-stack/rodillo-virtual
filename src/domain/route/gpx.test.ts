import { describe, expect, it } from 'vitest';
import { parseGpx } from './gpx';

const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Metadatos</name></metadata>
  <trk>
    <name>Subida &amp; vuelta</name>
    <trkseg>
      <trkpt lat="43.0000" lon="-2.0000"><ele>100</ele><time>2026-01-01T10:00:00Z</time></trkpt>
      <trkpt lon='-2.0010' lat='43.0005'>
        <ele> 105.5 </ele>
      </trkpt>
      <trkpt lat="43.0010" lon="-2.0020"></trkpt>
      <trkpt lat="999" lon="-2.0030"><ele>1</ele></trkpt>
      <trkpt lat="43.0020" lon="-2.0040"/>
    </trkseg>
  </trk>
</gpx>`;

describe('parseGpx', () => {
  it('reads points in any attribute order, with or without ele, skipping invalid ones', () => {
    const r = parseGpx(GPX);
    if (!r.ok) throw new Error(r.errors.join(' '));
    expect(r.value.name).toBe('Subida & vuelta');
    expect(r.value.points).toEqual([
      { lat: 43, lon: -2, ele: 100 },
      { lat: 43.0005, lon: -2.001, ele: 105.5 },
      { lat: 43.001, lon: -2.002, ele: null },
      { lat: 43.002, lon: -2.004, ele: null },
    ]);
  });

  it('falls back to route points', () => {
    const r = parseGpx(
      '<gpx><rte><rtept lat="1" lon="2"><ele>5</ele></rtept><rtept lat="1.001" lon="2"><ele>6</ele></rtept></rte></gpx>',
    );
    expect(r.ok && r.value.points).toHaveLength(2);
  });

  it('explains what is wrong', () => {
    expect(parseGpx('{"not":"gpx"}')).toEqual({ ok: false, errors: ['El archivo no es un GPX.'] });
    expect(parseGpx('<gpx></gpx>').ok).toBe(false);
    expect(parseGpx('<gpx><trk><trkpt lat="1" lon="2"><ele>1</ele></trkpt></trk></gpx>')).toEqual({
      ok: false,
      errors: ['El GPX necesita al menos 2 puntos válidos.'],
    });
    const noEle = parseGpx('<gpx><trkpt lat="1" lon="2"/><trkpt lat="1.1" lon="2"/></gpx>');
    expect(!noEle.ok && noEle.errors[0]).toMatch(/altitud/);
  });
});
