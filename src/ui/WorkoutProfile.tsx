import type { ReactNode } from 'react';
import type { Step } from '../domain/workout/types';
import { targetColor, targetHeightPct } from './targetStyle';

interface Props {
  steps: readonly Step[];
  big?: boolean;
  /** Colours and heights of fixed-watt blocks are relative to it. */
  ftpW?: number | null;
  /** Overlays drawn on top, such as the player cursor. */
  children?: ReactNode;
}

/** Bar chart of a workout: width is duration, height and colour are the zone. */
export default function WorkoutProfile({ steps, big = false, ftpW = null, children }: Props) {
  return (
    <div className={big ? 'profile big' : 'profile'} aria-hidden="true">
      {steps.map((step, i) => (
        <i
          key={i}
          style={{
            flex: `${step.durationSec} 1 0`,
            height: `${targetHeightPct(step.target, ftpW)}%`,
            background: targetColor(step.target, ftpW),
          }}
        />
      ))}
      {children}
    </div>
  );
}
