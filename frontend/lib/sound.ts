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
    const clicks = 14;
    for (let i = 0; i < clicks; i++) {
      setTimeout(() => this.playClick(90 + i * 38, 0.02, 0.28), i * 58);
    }
  }

  playClick(freq: number, dur: number, vol = 0.5) {
    this.init();
    if (!this.audioContext) return;
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
    this.init();
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = 140;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.55, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.05);
  }

  playEmptyChamber() {
    this.init();
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = 220;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.42, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.08);
  }

  playBulletLoad() {
    this.init();
    if (!this.audioContext) return;

    const click = (freq: number, delay: number, vol = 0.28, dur = 0.1) => {
      setTimeout(() => {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(vol, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + dur);
        osc.start();
        osc.stop(this.audioContext!.currentTime + dur);
      }, delay);
    };

    click(420, 0, 0.24, 0.09);
    click(300, 80, 0.34, 0.11);
  }

  playGunshot() {
    this.init();
    if (!this.audioContext) return;
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

  playReload() {
    this.init();
    if (!this.audioContext) return;

    // Heavy metallic "clack" — cylinder locking into place
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);
    osc1.type = 'square';
    osc1.frequency.value = 180;
    gain1.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    osc1.start();
    osc1.stop(this.audioContext.currentTime + 0.08);

    // Second sharper click after brief pause
    setTimeout(() => {
      if (!this.audioContext) return;
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.type = 'square';
      osc2.frequency.value = 350;
      gain2.gain.setValueAtTime(0.6, this.audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.06);
      osc2.start();
      osc2.stop(this.audioContext.currentTime + 0.06);
    }, 60);
  }

  playCashout() {
    this.init();
    if (!this.audioContext) return;

    const notes = [520, 660, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.22, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.12);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.12);
      }, i * 80);
    });
  }

  playWinJingle() {
    this.init();
    if (!this.audioContext) return;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.16);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.16);
      }, i * 95);
    });
  }
}
