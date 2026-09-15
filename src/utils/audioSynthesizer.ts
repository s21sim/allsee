// Web Audio API Sound Synthesizer for AllSee
// Generates authentic DTMF tones, Roger Beeps, Courtesy Chimes, and Squelch tails

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Dual-Tone Multi-Frequency (DTMF) Standard Frequencies
  // Low frequencies: 697, 770, 852, 941 Hz
  // High frequencies: 1209, 1336, 1477, 1633 Hz
  public playDtmf(key: string, durationMs: number = 180) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();

      const dtmfMap: Record<string, [number, number]> = {
        '1': [697, 1209],
        '2': [697, 1336],
        '3': [697, 1477],
        'A': [697, 1633],
        '4': [770, 1209],
        '5': [770, 1336],
        '6': [770, 1477],
        'B': [770, 1633],
        '7': [852, 1209],
        '8': [852, 1336],
        '9': [852, 1477],
        'C': [852, 1633],
        '*': [941, 1209],
        '0': [941, 1336],
        '#': [941, 1477],
        'D': [941, 1633],
      };

      const char = key.toUpperCase();
      const freqs = dtmfMap[char];
      if (!freqs) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      const startTime = ctx.currentTime;
      const endTime = startTime + durationMs / 1000;

      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.3 * this.volume, startTime + 0.01);
      gainNode.gain.setValueAtTime(0.3 * this.volume, endTime - 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(endTime);
      osc2.stop(endTime);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  // AllStarLink Roger Courtesy Beep (Double beep standard: e.g. 880Hz then 1046Hz)
  public playRogerBeep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // First beep (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.2 * this.volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Second beep (1046 Hz - C6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046, now + 0.08);
      gain2.gain.setValueAtTime(0.25 * this.volume, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  // Node Connect Success Chime (ascending major triad: C5 - E5 - G5)
  public playConnectChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {
      // ignore
    }
  }

  // Node Disconnect Chime (descending minor: G5 - Eb5 - C5)
  public playDisconnectChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [783.99, 622.25, 523.25];
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.12);
      });
    } catch {
      // ignore
    }
  }

  // Radio Receiver Squelch burst (short burst of filtered noise)
  public playSquelchTail() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const bufferSize = ctx.sampleRate * 0.06; // 60ms noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
