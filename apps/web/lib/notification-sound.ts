// A short two-note chime made with Web Audio, so there's no sound file to
// load. Browsers only allow audio after the page has had a click or a key
// press; until then the chime is silently skipped.

let context: AudioContext | null = null;

function audioContext() {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    return null;
  }
  context ??= new AudioContext();
  return context;
}

/** Call from a click handler so later chimes are allowed to play. */
export function unlockNotificationSound() {
  void audioContext()
    ?.resume()
    .catch(() => undefined);
}

export function playNotificationSound() {
  const audio = audioContext();
  if (!audio || audio.state !== "running") return;
  const start = audio.currentTime;
  for (const [index, frequency] of [880, 1320].entries()) {
    const at = start + index * 0.12;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.15, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.3);
  }
}

// The first interaction anywhere on the page unlocks the chime.
if (typeof window !== "undefined") {
  const unlock = () => unlockNotificationSound();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}
