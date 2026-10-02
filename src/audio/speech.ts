/** Speaks in Spanish, interrupting anything still being said. No-op without speech support. */
export function say(text: string): void {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;
    speechSynthesis.speak(utterance);
  } catch {
    // Speech is a nice-to-have; never break the player over it.
  }
}
