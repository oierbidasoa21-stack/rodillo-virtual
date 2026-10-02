import { powerBand, targetWatts } from '../../domain/workout/targets';
import type { BlockTarget } from '../../domain/workout/types';
import { powerZoneOfWatts, powerZones } from '../../domain/zones/powerZones';

/**
 * Second and third lines of the zone card for a power block:
 * "211 W (201–222)" and "Z3 · Tempo", or a hint when there's no FTP yet.
 */
export default function PowerTargetDetail({
  target,
  ftpW,
}: {
  target: BlockTarget;
  ftpW: number | null;
}) {
  const watts = targetWatts(target, ftpW);
  if (watts === null) {
    return <span className="rpe">Configura tu FTP en Ajustes para ver los vatios.</span>;
  }
  const band = powerBand(watts);
  const zone =
    ftpW === null ? null : powerZones(ftpW).find((z) => z.id === powerZoneOfWatts(watts, ftpW));
  return (
    <>
      <span className="rng num">
        {Math.round(watts)} W ({band.minW}–{band.maxW})
      </span>
      {zone && (
        <span className="rpe">
          {zone.id} · {zone.name}
        </span>
      )}
    </>
  );
}
