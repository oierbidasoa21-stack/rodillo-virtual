import { useState } from 'react';
import { type HrZone, ZONE_META, setZoneBound, validateZones } from '../../domain/zones/zones';
import { zoneBpmText } from '../format';
import NumberInput from '../NumberInput';
import { zoneColor } from '../zoneStyle';

interface Props {
  zones: HrZone[];
  /** Called only with a valid, contiguous set of zones. */
  onSave: (zones: HrZone[]) => void;
}

/**
 * Editable zone bounds. Changing a bound moves the neighbouring one so zones
 * stay contiguous; invalid drafts are shown with errors and not saved.
 */
export default function ZonesTable({ zones, onSave }: Props) {
  const [draft, setDraft] = useState(zones);
  const errors = validateZones(draft);

  const change = (zone: HrZone, bound: 'min' | 'max', value: number) => {
    const next = setZoneBound(draft, zone.id, bound, Math.round(value));
    setDraft(next);
    if (validateZones(next).length === 0) onSave(next);
  };

  return (
    <>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Desde /10″</th>
              <th>Hasta /10″</th>
              <th>ppm</th>
              <th className="feel">Sensación</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((z) => (
              <tr key={z.id}>
                <td>
                  <b style={{ color: zoneColor(z.id) }}>{z.id}</b>
                </td>
                <td>
                  <NumberInput
                    id={`zmin-${z.id}`}
                    aria-label={`${z.id} desde`}
                    min={1}
                    value={z.min}
                    onCommit={(v) => change(z, 'min', v)}
                  />
                </td>
                <td>
                  {z.max === null ? (
                    '—'
                  ) : (
                    <NumberInput
                      id={`zmax-${z.id}`}
                      aria-label={`${z.id} hasta`}
                      min={1}
                      value={z.max}
                      onCommit={(v) => change(z, 'max', v)}
                    />
                  )}
                </td>
                <td className="num nowrap">{zoneBpmText(z)}</td>
                <td className="note feel">{ZONE_META[z.id].feel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.length > 0 && (
        <div className="msg error" role="alert">
          <p style={{ margin: '0 0 4px' }}>
            Estos cambios no se guardan hasta que las zonas sean válidas:
          </p>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="note">
        Cambiar el final de una zona mueve el inicio de la siguiente, para que no queden huecos. Las
        ppm salen de multiplicar por 6 el pulso contado en 10 segundos.
      </p>
    </>
  );
}
