import { useEffect, useRef, useState } from 'react';
import { beep, unlockAudio } from '../../audio/beeper';
import { hrPer10sToBpm } from '../../domain/zones/heartRate';
import { type HrZone, classifyPer10s, zoneStatus } from '../../domain/zones/zones';
import { zoneColor } from '../zoneStyle';
import { STATUS_CLASS, STATUS_TEXT } from './zoneStatusText';

const PREP_SEC = 3;
const COUNT_SEC = 10;
const RESULT_MS = 2600;
const PAD_VALUES = Array.from({ length: 18 }, (_, i) => i + 18); // 18–35
const RING_C = 2 * Math.PI * 70;

type Phase = 'intro' | 'prep' | 'count' | 'pad' | 'result';

interface Props {
  target: HrZone;
  zones: readonly HrZone[];
  onCount: (valuePer10s: number) => void;
  onClose: () => void;
}

/**
 * Guided 10-second pulse count: 3-2-1, beep to start, 10 s ring, double beep
 * to stop, then a number pad. Beeps always sound here (the count depends on them),
 * even if beeps are off for the session.
 */
export default function HrCounter({ target, zones, onCount, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [prepLeft, setPrepLeft] = useState(PREP_SEC);
  const [elapsed, setElapsed] = useState(0);
  const [value, setValue] = useState<number | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (phase !== 'prep') return;
    let left = PREP_SEC;
    beep(600, 90);
    const id = setInterval(() => {
      left -= 1;
      if (left > 0) {
        setPrepLeft(left);
        beep(600, 90);
      } else {
        clearInterval(id);
        beep(1000, 300);
        setPhase('count');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'count') return;
    const t0 = performance.now();
    const id = setInterval(() => {
      const sec = (performance.now() - t0) / 1000;
      setElapsed(Math.min(COUNT_SEC, sec));
      if (sec >= COUNT_SEC) {
        clearInterval(id);
        beep(1000, 150);
        beep(1000, 150, 0.22);
        setPhase('pad');
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'result') return;
    const id = setTimeout(() => onCloseRef.current(), RESULT_MS);
    return () => clearTimeout(id);
  }, [phase]);

  const start = () => {
    unlockAudio();
    setPhase('prep');
  };
  const pick = (n: number) => {
    setValue(n);
    onCount(n);
    setPhase('result');
  };

  const status = value === null ? null : zoneStatus(value, target);
  const zoneOfValue = value === null ? null : classifyPer10s(value, zones);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cnt-title">
      <div className="box">
        <h3 id="cnt-title" style={{ fontSize: 24 }}>
          Contar pulso
        </h3>

        {(phase === 'intro' || phase === 'prep' || phase === 'count') && (
          <>
            <p className="note" style={{ margin: '0 auto' }}>
              {phase === 'intro' &&
                'Busca el pulso. Al pitido empieza a contar; al doble pitido para.'}
              {phase === 'prep' && 'Preparado…'}
              {phase === 'count' && 'Cuenta ahora'}
            </p>
            <div className="ring">
              <svg viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--line)" strokeWidth="10" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={zoneColor(target.id)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - elapsed / COUNT_SEC)}
                />
              </svg>
              <div className="c num" aria-live="polite">
                {phase === 'prep' ? prepLeft : Math.max(0, Math.ceil(COUNT_SEC - elapsed))}
              </div>
            </div>
          </>
        )}

        {phase === 'pad' && (
          <div>
            <p className="tag" style={{ margin: '0 0 8px' }}>
              ¿Cuántas pulsaciones has contado?
            </p>
            <div className="padgrid">
              {PAD_VALUES.map((n) => (
                <button key={n} type="button" onClick={() => pick(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && value !== null && status && (
          <div role="status">
            <div className={`clock num ${STATUS_CLASS[status]}`} style={{ fontSize: 72 }}>
              {value}
            </div>
            <p
              className={STATUS_CLASS[status]}
              style={{ margin: 0, fontSize: 18, fontWeight: 600 }}
            >
              {status === 'in' ? 'En zona' : `${STATUS_TEXT[status]} de`} {target.id}
            </p>
            <p className="note" style={{ margin: '4px auto 0' }}>
              {hrPer10sToBpm(value)} ppm ·{' '}
              {zoneOfValue ? `zona ${zoneOfValue.id}` : `por debajo de ${zones[0]?.id ?? 'L1'}`}
            </p>
          </div>
        )}

        <div className="actions" style={{ justifyContent: 'center' }}>
          {phase === 'intro' && (
            <button type="button" className="btn primary" onClick={start}>
              Empezar
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
