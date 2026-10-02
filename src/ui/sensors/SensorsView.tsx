import { useSettingsStore } from '../../store/settingsStore';
import SensorCard from './SensorCard';
import SimulationPanel from './SimulationPanel';

const hasBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

export default function SensorsView() {
  const simulate = useSettingsStore((s) => s.settings.simulateSensors);

  return (
    <>
      <div className="sectionhead">
        <h2>Sensores</h2>
      </div>
      {!simulate && !hasBluetooth && (
        <p className="msg error" role="alert">
          Este navegador no permite Bluetooth. Usa Chrome en el ordenador, o activa los sensores
          simulados en Ajustes → Desarrollo.
        </p>
      )}
      <div className="list">
        <SensorCard kind="hr" simulate={simulate} />
        <SensorCard kind="csc" simulate={simulate} />
      </div>

      {simulate ? (
        <>
          <div className="sectionhead">
            <h2>Simulación</h2>
          </div>
          <SimulationPanel />
        </>
      ) : (
        <div className="card note" style={{ marginTop: 14 }}>
          <p>
            Pulsa <b>Conectar</b> y elige el sensor en la lista de Chrome. No hace falta emparejarlo
            antes en la configuración Bluetooth de Windows.
          </p>
          <p>
            Si no aparece: comprueba que está encendido (la banda necesita contacto con la piel) y
            que no está conectado a otro dispositivo, como un reloj u otra app.
          </p>
          <p>
            Chrome te pedirá elegir el sensor una vez cada vez que abras la app. Si se cae durante
            una sesión, la app intenta reconectarlo sola.
          </p>
        </div>
      )}
    </>
  );
}
