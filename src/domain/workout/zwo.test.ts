import { describe, expect, it } from 'vitest';
import { totalDurationSec } from './expand';
import { expandWorkout } from './expand';
import { makeBlock, makeRepeat } from './types';
import { ZwoError, buildZwo, parseZwo, zwoFileName } from './zwo';

const FILE = `<?xml version="1.0" encoding="UTF-8"?>
<!-- a comment with <SteadyState Duration="1" Power="9"/> inside -->
<workout_file>
  <author>Someone</author>
  <name>Sweet spot &amp; ramps</name>
  <description><![CDATA[Two blocks <easy>]]></description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="150" PowerLow="0.40" PowerHigh="0.70"/>
    <SteadyState Duration="600" Power="0.88" Cadence="90">
      <textevent timeoffset="0" message="Stay smooth"/>
    </SteadyState>
    <IntervalsT Repeat="3" OnDuration="60" OffDuration="120" OnPower="1.20" OffPower="0.50"/>
    <FreeRide Duration="300"/>
    <Cooldown Duration="120" PowerLow="0.60" PowerHigh="0.40"/>
  </workout>
</workout_file>`;

describe('parseZwo', () => {
  const { workout, warnings } = parseZwo(FILE);

  it('reads name and description, decoding entities and CDATA', () => {
    expect(workout.name).toBe('Sweet spot & ramps');
    expect(workout.description).toBe('Two blocks <easy>');
  });

  it('turns a 2′30″ warm-up from 40 to 70 % into 1′ steps at their mean: 46, 58, 67 %', () => {
    expect(workout.blocks.slice(0, 3)).toEqual([
      makeBlock(60, { type: 'power', pctFtp: 46 }, 'warm'),
      makeBlock(60, { type: 'power', pctFtp: 58 }, 'warm'),
      makeBlock(30, { type: 'power', pctFtp: 67 }, 'warm'),
    ]);
  });

  it('keeps steady blocks with their message and intervals as a repeat', () => {
    expect(workout.blocks[3]).toEqual(
      makeBlock(600, { type: 'power', pctFtp: 88 }, 'steady', 'Stay smooth'),
    );
    expect(workout.blocks[4]).toEqual(
      makeRepeat(3, [
        makeBlock(60, { type: 'power', pctFtp: 120 }, 'work'),
        makeBlock(120, { type: 'power', pctFtp: 50 }, 'rec'),
      ]),
    );
  });

  it('makes a free ride an Z2 heart rate block and says so; the total time is kept', () => {
    expect(workout.blocks[5]).toEqual(makeBlock(300, 'Z2', 'steady', 'Rodaje libre'));
    expect(totalDurationSec(expandWorkout(workout.blocks))).toBe(150 + 600 + 540 + 300 + 120);
    expect(warnings).toContain('Las rampas se han convertido en escalones de 1 minuto.');
    expect(warnings.some((w) => w.startsWith('FreeRide'))).toBe(true);
  });

  it('ramps down in the cool-down: 55 then 45 %', () => {
    expect(workout.blocks.slice(6).map((b) => b.type === 'block' && b.target)).toEqual([
      { type: 'power', pctFtp: 55 },
      { type: 'power', pctFtp: 45 },
    ]);
  });

  it('rejects files that are not .zwo or have nothing usable', () => {
    expect(() => parseZwo('<gpx></gpx>')).toThrow(ZwoError);
    expect(() => parseZwo('<workout_file><workout></workout></workout_file>')).toThrow(ZwoError);
    expect(() =>
      parseZwo('<workout_file><workout><SteadyState Power="0.5"/></workout></workout_file>'),
    ).toThrow(/duración/);
  });
});

describe('buildZwo', () => {
  const ours = {
    name: 'Umbral "3×10′"',
    description: 'Por pulso & potencia',
    blocks: [
      makeBlock(600, 'Z2', 'warm', 'Suave'),
      makeRepeat(3, [
        makeBlock(600, { type: 'power', pctFtp: 95 }, 'work'),
        makeBlock(300, { type: 'power', pctFtp: 55 }, 'rec'),
      ]),
      makeRepeat(2, [makeBlock(60, 'Z4'), makeBlock(60, 'Z1')]),
    ],
  };
  const { xml, warnings } = buildZwo(ours);

  it('writes power as a fraction of FTP and simple repeats as IntervalsT', () => {
    expect(xml).toContain('<name>Umbral &quot;3×10′&quot;</name>');
    expect(xml).toContain(
      '<IntervalsT Repeat="3" OnDuration="600" OffDuration="300" OnPower="0.95" OffPower="0.55"></IntervalsT>',
    );
  });

  it('writes heart rate blocks as FreeRide with the zone, and warns', () => {
    expect(xml).toContain(
      '<FreeRide Duration="600"><textevent timeoffset="0" message="Zona Z2 (pulso)"/><textevent timeoffset="0" message="Suave"/></FreeRide>',
    );
    expect(xml.match(/<FreeRide/g)).toHaveLength(1 + 4); // the hr repeat is written out
    expect(warnings).toHaveLength(1);
  });

  it('round-trips our own workouts, heart rate zones included', () => {
    const back = parseZwo(xml);
    expect(back.warnings).toEqual([]);
    expect(back.workout.name).toBe(ours.name);
    expect(back.workout.description).toBe(ours.description);
    expect(
      expandWorkout(back.workout.blocks).map(({ durationSec, target, note }) => ({
        durationSec,
        target,
        note,
      })),
    ).toEqual(
      expandWorkout(ours.blocks).map(({ durationSec, target, note }) => ({
        durationSec,
        target,
        note,
      })),
    );
  });
});

describe('zwoFileName', () => {
  it('is plain ASCII', () => {
    expect(zwoFileName('Umbral 3×10′ (potencia)')).toBe('umbral-3-10-potencia.zwo');
    expect(zwoFileName('¿?')).toBe('sesion.zwo');
  });

  describe('parseZwo with files exported before phase 9', () => {
    it('reads the old zone markers, UA+ included', () => {
      const old = `<workout_file><name>Vieja</name><workout>
      <FreeRide Duration="300"><textevent timeoffset="0" message="Zona UA+ (pulso)"/></FreeRide>
      <FreeRide Duration="600"><textevent timeoffset="0" message="Zona L2 (pulso)"/></FreeRide>
    </workout></workout_file>`;
      expect(parseZwo(old).workout.blocks).toEqual([
        makeBlock(300, 'Z5', 'steady'),
        makeBlock(600, 'Z2', 'steady'),
      ]);
    });
  });
});
