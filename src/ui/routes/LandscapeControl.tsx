import { useMemo, useRef, useState } from 'react';
import { estimateBytes, landscapeTiles } from '../../domain/geo/landscape';
import type { Route } from '../../domain/route/route';
import { useRoutesStore } from '../../store/routesStore';
import { useUiStore } from '../../store/uiStore';
import type { DownloadProgress } from '../../tiles/download';
import { downloadLandscape } from '../../tiles/landscape';
import ConfirmButton from '../ConfirmButton';

const mb = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const toMb = (bytes: number) => `${mb.format(bytes / 1_000_000)} MB`;
const day = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Real landscape of a GPX route: download it (after the privacy notice), see
 * how it went, fill gaps or delete it. Nothing is fetched without a click.
 */
export default function LandscapeControl({ route }: { route: Route }) {
  const landscape = useRoutesStore((s) => s.landscapes[route.id]);
  const saveLandscape = useRoutesStore((s) => s.saveLandscape);
  const removeLandscape = useRoutesStore((s) => s.removeLandscape);
  const showToast = useUiStore((s) => s.showToast);
  const tiles = useMemo(() => landscapeTiles(route.points), [route]);
  const estimate = useMemo(() => estimateBytes(tiles), [tiles]);
  const [asking, setAsking] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const abort = useRef<AbortController | null>(null);

  const start = async () => {
    setAsking(false);
    const ctrl = new AbortController();
    abort.current = ctrl;
    setProgress({ done: 0, total: tiles.length, bytes: 0, failed: 0 });
    try {
      const r = await downloadLandscape(route, { signal: ctrl.signal, onProgress: setProgress });
      if (r.aborted) {
        showToast('Descarga cancelada: no se ha guardado nada nuevo como paisaje');
        return;
      }
      await saveLandscape({
        routeId: route.id,
        downloadedAtMs: Date.now(),
        tiles: r.total,
        failed: r.failed,
        bytes: r.bytes + (landscape?.bytes ?? 0),
      });
      showToast(
        r.failed
          ? `Paisaje descargado; ${r.failed} teselas no se pudieron bajar`
          : 'Paisaje real descargado',
      );
    } catch {
      showToast('No se pudo descargar el paisaje (¿sin conexión?)');
    } finally {
      abort.current = null;
      setProgress(null);
    }
  };

  if (progress) {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="landscape">
        <div className="landscape-row">
          <span>
            Descargando paisaje real… {progress.done} de {progress.total} ({toMb(progress.bytes)})
          </span>
          <button type="button" className="btn" onClick={() => abort.current?.abort()}>
            Cancelar
          </button>
        </div>
        <progress max={100} value={pct} aria-label="Progreso de la descarga del paisaje" />
      </div>
    );
  }

  if (asking) {
    return (
      <div className="landscape landscape-ask" role="group" aria-label="Descargar paisaje real">
        <p>
          Se piden a dos servicios externos las imágenes de esta zona (unos <b>{toMb(estimate)}</b>
          ):
        </p>
        <ul>
          <li>
            <b>Relieve</b>: AWS Terrain Tiles.
          </li>
          <li>
            <b>Foto de satélite</b>: Sentinel-2 cloudless de EOX, con licencia CC BY-NC-SA 4.0 (solo
            uso no comercial).
          </li>
        </ul>
        <p>
          Esos servicios sabrán qué zona pides, pero <b>nunca tu GPX</b>. Lo descargado se guarda en
          este navegador y sirve sin conexión.
        </p>
        <div className="actions">
          <button type="button" className="btn primary" onClick={() => void start()}>
            Descargar
          </button>
          <button type="button" className="btn" onClick={() => setAsking(false)}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (landscape) {
    return (
      <div className="landscape">
        <div className="landscape-row">
          <span>
            <b>Paisaje real</b> descargado el {day.format(landscape.downloadedAtMs)}.
            {landscape.failed > 0 && (
              <>
                {' '}
                Faltan {landscape.failed} de {landscape.tiles} teselas: esos trozos usan el suelo de
                siempre.
              </>
            )}
          </span>
          <span className="actions">
            {landscape.failed > 0 && (
              <button type="button" className="btn" onClick={() => setAsking(true)}>
                Completar
              </button>
            )}
            <ConfirmButton
              label="Borrar paisaje"
              onConfirm={() => {
                void removeLandscape(route.id);
                showToast('Paisaje borrado');
              }}
            />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="landscape">
      <div className="landscape-row">
        <span className="note">
          Relieve real y foto de satélite de la zona en la vista 3D (unos {toMb(estimate)}).
        </span>
        <button type="button" className="btn" onClick={() => setAsking(true)}>
          Descargar paisaje real
        </button>
      </div>
    </div>
  );
}
