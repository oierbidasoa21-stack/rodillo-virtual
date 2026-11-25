import { describe, expect, it } from 'vitest';
import { EMPTY_READING, type RecordSample } from './recording';
import { buildTcx, tcxFileName } from './tcx';

const START = Date.UTC(2026, 10, 25, 17, 30, 0);
const sample = (t: number, extra: Partial<RecordSample>): RecordSample => ({
  ...EMPTY_READING,
  t,
  ...extra,
});

describe('buildTcx', () => {
  const samples = [
    sample(1, {
      hr: 120,
      powerW: 200.4,
      speedKmh: 36,
      cadenceRpm: 88,
      distanceM: 10,
      altitudeM: 300,
      lat: 43.1,
      lon: -2.5,
    }),
    sample(2, {
      hr: 140,
      powerW: 210,
      speedKmh: 36,
      cadenceRpm: 90,
      distanceM: 20,
      altitudeM: 300.5,
      lat: 43.1001,
      lon: -2.5,
    }),
    sample(3, {}),
  ];
  const tcx = buildTcx({
    name: 'Umbral & co',
    startMs: START,
    samples,
    kcal: 123.4,
    powerEstimated: true,
    simulated: true,
  });

  it('is a biking activity with one lap and one trackpoint per second', () => {
    expect(tcx).toContain('<Activity Sport="Biking">');
    expect(tcx).toContain('<Id>2026-11-25T17:30:00Z</Id>');
    expect(tcx.match(/<Trackpoint>/g)).toHaveLength(3);
    expect(tcx).toContain('<Time>2026-11-25T17:30:01Z</Time>');
    expect(tcx).toContain('<Time>2026-11-25T17:30:03Z</Time>');
  });

  it('writes the lap totals: 3 s, 20 m, 123 kcal, HR avg 130 / max 140', () => {
    expect(tcx).toContain(
      '<TotalTimeSeconds>3</TotalTimeSeconds><DistanceMeters>20.0</DistanceMeters><Calories>123</Calories>',
    );
    expect(tcx).toContain(
      '<AverageHeartRateBpm><Value>130</Value></AverageHeartRateBpm><MaximumHeartRateBpm><Value>140</Value></MaximumHeartRateBpm>',
    );
  });

  it('writes channels in schema order and speed in m/s, watts rounded', () => {
    expect(tcx).toContain(
      '<Trackpoint><Time>2026-11-25T17:30:01Z</Time><Position><LatitudeDegrees>43.1000000</LatitudeDegrees><LongitudeDegrees>-2.5000000</LongitudeDegrees></Position><AltitudeMeters>300.0</AltitudeMeters><DistanceMeters>10.0</DistanceMeters><HeartRateBpm><Value>120</Value></HeartRateBpm><Cadence>88</Cadence><Extensions><ns3:TPX><ns3:Speed>10.00</ns3:Speed><ns3:Watts>200</ns3:Watts></ns3:TPX></Extensions></Trackpoint>',
    );
  });

  it('leaves out what was not recorded and escapes the name', () => {
    expect(tcx).toContain('<Trackpoint><Time>2026-11-25T17:30:03Z</Time></Trackpoint>');
    expect(tcx).toContain(
      '<Notes>Umbral &amp; co · Rodillo Virtual Potencia estimada con la curva del rodillo. Datos de sensores simulados.</Notes>',
    );
  });

  it('has no heart rate summary without heart rate', () => {
    const none = buildTcx({
      name: 'x',
      startMs: START,
      samples: [sample(1, { speedKmh: 30 })],
      kcal: null,
      powerEstimated: false,
      simulated: false,
    });
    expect(none).not.toContain('HeartRateBpm');
    expect(none).toContain('<Calories>0</Calories>');
  });
});

describe('tcxFileName', () => {
  it('uses the local date and a plain-ASCII slug', () => {
    expect(tcxFileName(new Date(2026, 10, 25, 18, 5).getTime(), 'Umbral 3×10′ (potencia)')).toBe(
      'rodillo-2026-11-25-1805-umbral-3-10-potencia.tcx',
    );
    expect(tcxFileName(new Date(2026, 0, 2, 7, 0).getTime(), '¡¿?!')).toBe(
      'rodillo-2026-01-02-0700-salida.tcx',
    );
  });
});
