// Confetti celebration helper using dynamic import of canvas-confetti
const firedEvents = new Set<string>();

export interface CelebrateOptions {
  eventKey?: string; // If provided, ensures it fires only once per eventKey
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

export async function celebrate(options: CelebrateOptions = {}) {
  const {
    eventKey,
    particleCount = 100,
    spread = 70,
    origin = { x: 0.5, y: 0.6 },
  } = options;

  if (eventKey) {
    if (firedEvents.has(eventKey)) return;
    firedEvents.add(eventKey);
  }

  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;

    // Palette: Warm Orange, Sun Yellow, and AI Teal
    const colors = ['#F97316', '#FFC53D', '#12A594', '#EA580C', '#FFE3C7'];

    confetti({
      particleCount,
      spread,
      origin,
      colors,
      disableForReducedMotion: true,
      ticks: 120, // ~1.2s duration
      scalar: 1.1,
    });
  } catch (err) {
    console.warn('Confetti animation failed to load:', err);
  }
}

export function resetCelebration(eventKey: string) {
  firedEvents.delete(eventKey);
}

export default celebrate;
