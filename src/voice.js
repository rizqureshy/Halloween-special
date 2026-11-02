// The browser's own voice, dry and a little slow. Starts only from a click.
export const voice = {
  on: false,
  ready: () => 'speechSynthesis' in window,
  pick() {
    if (!this.ready()) return null;
    const vs = speechSynthesis.getVoices();
    return (
      vs.find((v) => /en-GB/i.test(v.lang) && /Daniel|Arthur|Google UK English Male/i.test(v.name)) ||
      vs.find((v) => /en-GB/i.test(v.lang)) ||
      vs.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  },
  say(text) {
    if (!this.on || !this.ready()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.pick();
    if (v) u.voice = v;
    u.rate = 0.92;
    u.pitch = 0.82;
    speechSynthesis.speak(u);
  },
  stop() {
    if (this.ready()) speechSynthesis.cancel();
  },
};

// A little ambience from WebAudio: wind through a low-pass, a low drone, no files.
export const ambience = {
  ctx: null,
  nodes: null,
  on: false,
  start() {
    if (this.on) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    this.ctx = this.ctx || new C();
    const ctx = this.ctx;
    ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // wind: brown noise, filtered, slowly breathing
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.5; }
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const windGain = ctx.createGain(); windGain.gain.value = 0.25;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain); lfoGain.connect(windGain.gain);
    noise.connect(lp); lp.connect(windGain); windGain.connect(master);
    // drone: two detuned sines an octave apart
    const d1 = ctx.createOscillator(); d1.frequency.value = 55;
    const d2 = ctx.createOscillator(); d2.frequency.value = 110.6;
    const dg = ctx.createGain(); dg.gain.value = 0.06;
    d1.connect(dg); d2.connect(dg); dg.connect(master);
    noise.start(); lfo.start(); d1.start(); d2.start();
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
    this.nodes = { master, noise, lfo, d1, d2 };
    this.on = true;
  },
  stop() {
    if (!this.on) return;
    const { master, noise, lfo, d1, d2 } = this.nodes;
    master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    setTimeout(() => { [noise, lfo, d1, d2].forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }); master.disconnect(); }, 900);
    this.on = false;
  },
};
