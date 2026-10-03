import { positionAt } from '../../domain/route/position';
import type { RideMode, RideState } from '../../domain/route/ride';
import type { Route } from '../../domain/route/route';
import ElevationProfile from './ElevationProfile';
import MiniMap from './MiniMap';
import { formatGrade, formatKm, gradeColor } from './rideFormat';

interface Props {
  route: Route;
  mode: RideMode;
  ride: RideState;
}

const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** The route under a workout: it loops until the workout ends. */
export default function RouteStrip({ route, mode, ride }: Props) {
  const here = positionAt(route, ride.distanceM, true);
  return (
    <div className="route-strip">
      <div className="route-strip-hud">
        <div className="hud-grade small" style={{ background: gradeColor(here.grade) }}>
          <span className="hud-l">Pendiente</span>
          <span className="hud-v num">{formatGrade(here.grade)}</span>
        </div>
        <div className="hud-cell">
          <span className="hud-l">{mode === 'power' ? 'Vel. virtual' : 'Vel. rueda'}</span>
          <span className="hud-v num">{oneDecimal.format(ride.speedMs * 3.6)}</span>
          <span className="hud-u">km/h</span>
        </div>
        <div className="hud-cell">
          <span className="hud-l">Distancia</span>
          <span className="hud-v num">{formatKm(ride.distanceM)}</span>
        </div>
        <div className="hud-cell">
          <span className="hud-l">Vuelta</span>
          <span className="hud-v num">{here.lap + 1}</span>
          <span className="hud-u">
            {oneDecimal.format(here.lapDistanceM / 1000)}/{formatKm(route.distanceM)}
          </span>
        </div>
        <div className="hud-cell">
          <span className="hud-l">Desnivel</span>
          <span className="hud-v num">+{Math.round(ride.ascentM)}</span>
          <span className="hud-u">m</span>
        </div>
      </div>
      <div className="ride-graphs">
        <div className="card ride-profile">
          <span className="tag">{route.name}</span>
          <ElevationProfile route={route} positionM={here.lapDistanceM} height={70} />
        </div>
        <div className="card ride-map">
          <MiniMap route={route} at={here} height={88} />
        </div>
      </div>
    </div>
  );
}
