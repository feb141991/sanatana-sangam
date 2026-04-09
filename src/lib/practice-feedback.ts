let audioContextRef: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContextRef) audioContextRef = new AudioCtor();
  return audioContextRef;
}

export function playBeadTapFeedback() {
  navigator.vibrate?.([10]);

  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(320, now);
  oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.05);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.08);
}
