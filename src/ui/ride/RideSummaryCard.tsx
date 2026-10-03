import type { RideSummary } from '../../domain/metrics/summary';
import { RIDE_MODE_LABEL } from './rideMode';
import { formatKm } from './rideFormat';

const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Route part of a summary: distance, speed, climbing and how it was ridden. */
export default function RideSummaryCard({ ride }: { ride: RideSummary }) {
  return (
    <>
      <div className="sectionhead">
        <h2>Ruta · {ride.routeName}</h2>
        <span className="tag">{RIDE_MODE_LABEL[ride.mode]}</span>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="v num">{formatKm(ride.distanceM)}</div>
          <div className="l">Distancia</div>
        </div>
        <div className="stat">
          <div className="v num">{oneDecimal.format(ride.avgSpeedKmh)}</div>
          <div className="l">Velocidad media (km/h{ride.mode === 'power' ? ', virtual' : ''})</div>
        </div>
        <div className="stat">
          <div className="v num">+{Math.round(ride.ascentM)}</div>
          <div className="l">Desnivel (m)</div>
        </div>
        {ride.laps > 0 && (
          <div className="stat">
            <div className="v num">{ride.laps}</div>
            <div className="l">Vueltas completas</div>
          </div>
        )}
      </div>
    </>
  );
}
