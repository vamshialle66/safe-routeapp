/** User-initiated, local-only ringtone. Never requests microphone access. */
export function createFakeCallRingtone() {
  const context = new AudioContext();
  const output = context.createGain();
  output.gain.value = 0.22;
  output.connect(context.destination);
  let stopped = false;
  const voices = new Set<OscillatorNode>();
  const ring = () => {
    if (stopped) return;
    const now = context.currentTime;
    // A two-part telephone chime followed by a pause.
    for (const offset of [0, 0.65]) {
      for (const frequency of [660, 880]) {
        const voice = context.createOscillator();
        const envelope = context.createGain();
        voice.type = "sine";
        voice.frequency.value = frequency;
        envelope.gain.setValueAtTime(0, now + offset);
        envelope.gain.linearRampToValueAtTime(0.45, now + offset + 0.025);
        envelope.gain.setValueAtTime(0.45, now + offset + 0.4);
        envelope.gain.linearRampToValueAtTime(0, now + offset + 0.5);
        voice.connect(envelope);
        envelope.connect(output);
        voices.add(voice);
        voice.onended = () => { voices.delete(voice); voice.disconnect(); envelope.disconnect(); };
        voice.start(now + offset);
        voice.stop(now + offset + 0.51);
      }
    }
  };
  const ready = context.resume();
  ring();
  const interval = window.setInterval(ring, 2800);
  return {
    ready,
    stop() {
      if (stopped) return;
      stopped = true;
      window.clearInterval(interval);
      for (const voice of voices) { try { voice.stop(); } catch { /* Already ended. */ } }
      output.disconnect();
      void context.close().catch(() => {});
    },
  };
}