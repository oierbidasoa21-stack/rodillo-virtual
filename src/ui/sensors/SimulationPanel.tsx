import { sensorManager } from '../../sensors/manager';
import { useSimulationStore } from '../../store/simulationStore';

/** Controls for the simulated sensors (only shown when they are on). */
export default function SimulationPanel() {
  const sim = useSimulationStore();
  return (
    <div className="card">
      <div className="field">
        <label htmlFor="sim-follow">Pulso: seguir la zona del bloque</label>
        <input
          id="sim-follow"
          type="checkbox"
          checked={sim.followZone}
          onChange={(e) => sim.set({ followZone: e.target.checked })}
        />
      </div>
      <div className="field">
        <label htmlFor="sim-bpm">Pulso objetivo</label>
        <input
          id="sim-bpm"
          type="range"
          min={60}
          max={200}
          value={sim.targetBpm}
          disabled={sim.followZone}
          onChange={(e) => sim.set({ targetBpm: e.target.valueAsNumber })}
        />
        <span className="num">{sim.targetBpm} ppm</span>
      </div>
      <div className="field">
        <label htmlFor="sim-speed">Velocidad</label>
        <input
          id="sim-speed"
          type="range"
          min={0}
          max={60}
          value={sim.speedKmh}
          onChange={(e) => sim.set({ speedKmh: e.target.valueAsNumber })}
        />
        <span className="num">{sim.speedKmh} km/h</span>
      </div>
      <div className="field">
        <label htmlFor="sim-cadence">Cadencia</label>
        <input
          id="sim-cadence"
          type="range"
          min={0}
          max={130}
          value={sim.cadenceRpm}
          disabled={!sim.cadenceEnabled}
          onChange={(e) => sim.set({ cadenceRpm: e.target.valueAsNumber })}
        />
        <span className="num">{sim.cadenceRpm} rpm</span>
      </div>
      <div className="field">
        <label htmlFor="sim-cadence-on">Sensor con cadencia</label>
        <input
          id="sim-cadence-on"
          type="checkbox"
          checked={sim.cadenceEnabled}
          onChange={(e) => sim.set({ cadenceEnabled: e.target.checked })}
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn ghost"
          onClick={() => sensorManager.simulateDrop('hr')}
        >
          Simular caída del pulsómetro
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => sensorManager.simulateDrop('csc')}
        >
          Simular caída del sensor de velocidad
        </button>
      </div>
      <p className="note" style={{ margin: 0 }}>
        Con «seguir la zona», durante una sesión el pulso simulado va hacia el centro de la zona de
        cada bloque. Una caída dura unos 5 segundos.
      </p>
    </div>
  );
}
