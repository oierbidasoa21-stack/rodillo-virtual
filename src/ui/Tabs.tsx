import { type Tab, useUiStore } from '../store/uiStore';

const TABS: { id: Tab; label: string }[] = [
  { id: 'library', label: 'Sesiones' },
  { id: 'routes', label: 'Rutas' },
  { id: 'history', label: 'Historial' },
  { id: 'sensors', label: 'Sensores' },
  { id: 'settings', label: 'Ajustes' },
];

export default function Tabs() {
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);
  return (
    <nav className="tabs" role="tablist">
      {TABS.map((t) => (
        <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
