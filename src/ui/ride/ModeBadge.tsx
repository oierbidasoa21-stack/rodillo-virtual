import type { RideMode } from '../../domain/route/ride';
import { RIDE_MODE_LABEL } from './rideMode';

/** The ride's mode, always on screen: power (physics) or wheel speed (no power). */
export default function ModeBadge({ mode, simulated }: { mode: RideMode; simulated: boolean }) {
  return (
    <span className={`mode-badge mode-${mode}`} role="status">
      {RIDE_MODE_LABEL[mode]}
      {simulated && <span className="sim-tag">SIMULADO</span>}
    </span>
  );
}
