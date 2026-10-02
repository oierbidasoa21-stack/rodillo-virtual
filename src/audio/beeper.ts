let ctx: AudioContext | null = null;

/**
 * Creates or resumes the audio context. Browsers only allow this from a user
 * gesture, so call it from a click handler (e.g. "Empezar") before any beep.
 */
export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Short square-wave beep. Silently does nothing until audio is unlocked. */
export function beep(freqHz = 880, durationMs = 140, delaySec = 0): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freqHz;
  const t = ctx.currentTime + delaySec;
  const end = t + durationMs / 1000;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(end + 0.02);
}
