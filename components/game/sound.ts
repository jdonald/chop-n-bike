// Synthesized sound effects (Web Audio API) so the game ships with no audio files.

export type SoundName =
  | 'jump'
  | 'land'
  | 'swim'
  | 'splash'
  | 'swing'
  | 'chop'
  | 'hit'
  | 'bike'
  | 'portal'
  | 'whistle';

const MUTE_KEY = 'chop-n-bike-muted';

class SoundEffects {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;

  constructor() {
    try {
      this.muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Storage can be unavailable (private mode); muting still works for this session.
    }
  }

  // Browsers (iOS especially) only allow audio to start from a user gesture.
  unlock() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);

      const length = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state !== 'running') {
      void this.ctx.resume();
    }
  }

  play(name: SoundName) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    switch (name) {
      case 'jump':
        this.tone('triangle', 320, 720, 0.16, 0.25);
        break;
      case 'land':
        this.tone('sine', 140, 60, 0.12, 0.3);
        this.noiseBurst(0.08, 0.15, 'lowpass', 500, 200);
        break;
      case 'swim':
        this.noiseBurst(0.25, 0.18, 'lowpass', 900, 250);
        this.tone('sine', 480, 900, 0.08, 0.08, 0.05);
        break;
      case 'splash':
        this.noiseBurst(0.55, 0.45, 'lowpass', 3500, 300);
        this.tone('sine', 300, 120, 0.25, 0.12);
        break;
      case 'swing':
        this.noiseBurst(0.22, 0.3, 'bandpass', 500, 2600, 0, 1.5);
        break;
      case 'chop':
        this.tone('triangle', 190, 80, 0.2, 0.5);
        this.noiseBurst(0.07, 0.4, 'bandpass', 1400, 900, 0, 2);
        this.tone('triangle', 150, 70, 0.15, 0.3, 0.12);
        break;
      case 'hit':
        this.tone('square', 650, 140, 0.22, 0.15);
        this.noiseBurst(0.1, 0.25, 'highpass', 2000, 800);
        break;
      case 'bike':
        for (const delay of [0, 0.2]) {
          this.tone('sine', 2100, 2100, 0.45, 0.15, delay);
          this.tone('sine', 2950, 2950, 0.3, 0.06, delay);
        }
        break;
      case 'portal':
        [523, 659, 784, 1047].forEach((freq, i) => {
          this.tone('sine', freq, freq, 0.35, 0.2, i * 0.1);
          this.tone('triangle', freq * 2, freq * 2, 0.2, 0.05, i * 0.1);
        });
        break;
      case 'whistle':
        for (const [delay, length] of [
          [0, 0.35],
          [0.45, 0.7]
        ]) {
          this.tone('triangle', 466, 470, length, 0.12, delay, 0.04);
          this.tone('triangle', 587, 592, length, 0.12, delay, 0.04);
          this.tone('sawtooth', 698, 702, length, 0.025, delay, 0.04);
        }
        break;
    }
  }

  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    duration: number,
    volume: number,
    delay = 0,
    attack = 0.005
  ) {
    const ctx = this.ctx!;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(this.master!);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private noiseBurst(
    duration: number,
    volume: number,
    filterType: BiquadFilterType,
    from: number,
    to: number,
    delay = 0,
    q = 1
  ) {
    const ctx = this.ctx!;
    const start = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(start);
    source.stop(start + duration + 0.05);
  }
}

export const sfx = new SoundEffects();
