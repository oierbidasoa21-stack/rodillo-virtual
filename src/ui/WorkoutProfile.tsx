import type { ReactNode } from 'react';
import type { Step } from '../domain/workout/types';
import { targetColor, targetHeightPct } from './targetStyle';

interface Props {
  steps: readonly Step[];
  big?: boolean;
  /** Overlays drawn on top, such as the player cursor. */
  children?: ReactNode;
}

/** Bar chart of a workout: width is duration, height and colour are the zone. */
export default function WorkoutProfile({ steps, big = false, children }: Props) {
  return (
    <div className={big ? 'profile big' : 'profile'} aria-hidden="true">
      {steps.map((step, i) => (
        <i
          key={i}
          style={{
            flex: `${step.durationSec} 1 0`,
            height: `${targetHeightPct(step.target)}%`,
            background: targetColor(step.target),
          }}
        />
      ))}
      {children}
    </div>
  );
}
