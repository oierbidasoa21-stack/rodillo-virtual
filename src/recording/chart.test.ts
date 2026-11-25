import { describe, expect, it } from 'vitest';
import { channelRange, chartRuns, niceTicks } from './chart';
import { EMPTY_READING, type RecordSample } from './recording';

const hr = (values: (number | null)[]): RecordSample[] =>
  values.map((v, i) => ({ ...EMPTY_READING, t: i + 1, hr: v }));

describe('chartRuns', () => {
  it('keeps every second when there are few', () => {
    expect(chartRuns(hr([100, 110]), 'hr', 10)).toEqual([
      [
        { t: 1, v: 100 },
        { t: 2, v: 110 },
      ],
    ]);
  });

  it('averages buckets: 6 s into 3 points of 2 s', () => {
    const runs = chartRuns(hr([100, 102, 110, 112, 120, 122]), 'hr', 3);
    expect(runs).toEqual([
      [
        { t: 1.5, v: 101 },
        { t: 3.5, v: 111 },
        { t: 5.5, v: 121 },
      ],
    ]);
  });

  it('breaks the line where there is no reading', () => {
    const runs = chartRuns(hr([100, null, null, 120]), 'hr', 4);
    expect(runs.map((r) => r.map((p) => p.v))).toEqual([[100], [120]]);
    expect(chartRuns(hr([null, null]), 'hr', 4)).toEqual([]);
  });
});

describe('channelRange', () => {
  it('ignores missing readings', () => {
    expect(channelRange(hr([100, null, 140]), 'hr')).toEqual({ min: 100, max: 140, avg: 120 });
    expect(channelRange(hr([null]), 'hr')).toBeNull();
  });
});

describe('niceTicks', () => {
  it('picks round steps that cover the range', () => {
    expect(niceTicks(83, 162)).toEqual([80, 100, 120, 140, 160, 180]);
    expect(niceTicks(0, 31.4)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(150, 150)).toEqual([149, 151]);
  });
});
