import type { ReactNode } from 'react';
import type { Step } from '../domain/workout/types';
import { ZONE_IDS } from '../domain/zones/zones';
import { zoneColor } from './zoneStyle';

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
            height: `${22 + ZONE_IDS.indexOf(step.zoneId) * 15.6}%`,
            background: zoneColor(step.zoneId),
          }}
        />
      ))}
      {children}
    </div>
  );
}
