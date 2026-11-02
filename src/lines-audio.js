// His recorded voice: one MP3 per line, generated with ElevenLabs (voice
// "Timothy Pemberton Smythe", model eleven_v4) and cut from thirteen batches
// with Scribe word timestamps. The manifest maps each line's text to its
// file; a line with no recording falls back to the browser voice.
import manifest from './voice-manifest.json';

const byText = new Map(Object.entries(manifest).map(([id, m]) => [m.text, { id, ...m }]));
let current = null;
let unlocked = false;

export const recorded = {
  has: (text) => byText.has(text),
  /** Length of a line's recording in seconds, 0 if there is none. */
  duration: (text) => { const m = byText.get(text); return m ? Math.max(0, (m.end ?? 0) - (m.start ?? 0)) : 0; },
  /** Play the recording for a line. Resolves true if one played. */
  play(text, { volume = 1 } = {}) {
    const m = byText.get(text);
    if (!m) return false;
    this.stop();
    const a = new Audio(`./voice/${m.id}.mp3`);
    a.volume = volume;
    current = a;
    a.play().then(() => { recorded.played = true; recorded.blocked = false; }).catch(() => { recorded.blocked = true; });
    return true;
  },
  stop() { if (current) { current.pause(); current = null; } },
  playing: () => !!current && !current.paused && !current.ended,
  /** Warm the audio pipeline on the first click so later plays are instant. */
  unlock() { if (unlocked) return; unlocked = true; const a = new Audio(); a.muted = true; a.play().catch(() => {}); },
  count: byText.size,
  /** True once a recording has actually played; blocked while the browser's autoplay rule stops it. */
  played: false,
  blocked: false,
};
