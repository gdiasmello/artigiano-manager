
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPop() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx!.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }

  playCash() {
    this.init();
    const now = this.ctx!.currentTime;
    [800, 1200].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (i * 0.02));
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + (i * 0.02));
      osc.stop(now + 0.12);
    });
  }

  playSuccess() {
    this.init();
    const now = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (i * 0.1));
      gain.gain.setValueAtTime(0.1, now + (i * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + (i * 0.1));
      osc.stop(now + (i * 0.1) + 0.4);
    });
  }

  playAlert() {
    this.init();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(now + 0.3);
  }

  playBubbles() {
    this.init();
    const now = this.ctx!.currentTime;
    for(let i=0; i<5; i++) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random()*1000, now + (i * 0.1));
        gain.gain.setValueAtTime(0.05, now + (i * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + (i * 0.1));
        osc.stop(now + (i * 0.1) + 0.05);
    }
  }
}

export const audio = new AudioService();
