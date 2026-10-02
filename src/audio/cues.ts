import type { PlayerEvent } from '../domain/workout/player';
import { announceStep, announceWarning } from './announcements';
import { beep } from './beeper';
import { say } from './speech';

export interface CueSettings {
  beeps: boolean;
  voice: boolean;
}

/** Turns player events into beeps and speech, honouring the user's settings. */
export function playCues(events: readonly PlayerEvent[], { beeps, voice }: CueSettings): void {
  const tone = (freq: number, ms: number, delay = 0) => {
    if (beeps) beep(freq, ms, delay);
  };
  const speak = (text: string) => {
    if (voice) say(text);
  };

  for (const event of events) {
    switch (event.type) {
      case 'started':
        tone(660, 120);
        tone(990, 220, 0.15);
        speak(announceStep(event.step));
        break;
      case 'warn10s':
        tone(740, 160);
        speak(announceWarning(event.next));
        break;
      case 'countdown':
        tone(880, 110);
        break;
      case 'stepChanged':
        tone(1175, 260);
        // Automatic changes were already announced by the 10 s warning.
        if (event.manual) speak(announceStep(event.step));
        break;
      case 'finished':
        tone(880, 150);
        tone(1175, 150, 0.18);
        tone(1568, 300, 0.36);
        speak('Sesión terminada');
        break;
    }
  }
}
