import { useState } from 'react';
import { useHistoryStore } from '../../store/historyStore';
import FormCard from './FormCard';
import NextSessionCard from './NextSessionCard';
import WeekCard from './WeekCard';

/** Home panel: the next plan session, this week and how fresh you are. */
export default function HomeView() {
  const sessions = useHistoryStore((s) => s.sessions);
  // Fixed while the panel is open: enough for a page that shows days, not seconds.
  const [now] = useState(() => Date.now());
  return (
    <div className="home">
      <NextSessionCard now={now} />
      <WeekCard sessions={sessions} now={now} />
      <FormCard sessions={sessions} now={now} />
    </div>
  );
}
