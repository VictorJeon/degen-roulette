export class SoundEngine {
  private audioContext: AudioContext | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.initialized = true;
  }

  playCylinderSpin() {
    this.init();
    const clicks = 12;
    for (let i = 0; i < clicks; i++) {
      setTimeout(() => this.playClick(100 + i * 50, 0.02, 0.3), i * 66);
    }
  }

  playClick(freq: number, dur: number, vol = 0.5) {
    if (!this.audioContext) return;
    this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(vol, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + dur);
    osc.start();
    osc.stop(this.audioContext.currentTime + dur);
  }

  playTrigger() {
    if (!this.audioContext) return;
    this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = 150;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.05);
  }

  playEmptyChamber() {
    if (!this.audioContext) return;
    this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = 200;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.08);
  }

  playBulletLoad() {
    if (!this.audioContext) return;
    this.init();
    // Metallic click for loading bullet
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = 400;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);

    // Second click
    setTimeout(() => {
      if (!this.audioContext) return;
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.frequency.value = 300;
      osc2.type = 'square';
      gain2.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      osc2.start();
      osc2.stop(this.audioContext.currentTime + 0.1);
    }, 80);
  }

  playGunshot() {
    if (!this.audioContext) return;
    this.init();
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    noiseGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    noise.start();
    noise.stop(this.audioContext.currentTime + 0.5);

    const boom = this.audioContext.createOscillator();
    const boomGain = this.audioContext.createGain();
    boom.connect(boomGain);
    boomGain.connect(this.audioContext.destination);
    boom.frequency.setValueAtTime(80, this.audioContext.currentTime);
    boom.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.2);
    boomGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    boom.start();
    boom.stop(this.audioContext.currentTime + 0.3);
  }
}
