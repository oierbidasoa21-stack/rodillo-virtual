import { useState } from 'react';
import type { Route } from '../../domain/route/route';
import ConfirmButton from '../ConfirmButton';
import ElevationProfile from '../ride/ElevationProfile';
import { RIDE_MODE_LABEL, type RideReadiness } from '../ride/rideMode';
import { formatKm } from '../ride/rideFormat';

interface Props {
  route: Route;
  readiness: RideReadiness;
  onRide: () => void;
  onDelete?: () => void;
}

const pct = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export default function RouteCard({ route, readiness, onRide, onDelete }: Props) {
  const [missing, setMissing] = useState<string[]>([]);
  return (
    <article className="card">
      <div className="row1">
        <h3>{route.name}</h3>
        <span className="tag">{route.source === 'builtin' ? 'Ejemplo' : 'Importada'}</span>
      </div>
      {route.description && <p>{route.description}</p>}
      <p className="num">
        {formatKm(route.distanceM)} · +{Math.round(route.ascentM)} m · máx.{' '}
        {pct.format(route.maxGrade * 100)} %
      </p>
      <ElevationProfile route={route} height={60} />
      {missing.length > 0 && (
        <p className="msg error" role="alert">
          {missing.join(' ')}
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (readiness.ok) onRide();
            else setMissing(readiness.missing);
          }}
        >
          Rodar
        </button>
        {onDelete && <ConfirmButton label="Borrar" onConfirm={onDelete} />}
        {readiness.ok && <span className="note">{RIDE_MODE_LABEL[readiness.mode]}</span>}
      </div>
    </article>
  );
}
