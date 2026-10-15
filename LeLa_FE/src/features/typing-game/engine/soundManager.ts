class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  private initCtx() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('SoundManager initCtx warning:', err);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch (err) {
        console.warn('SoundManager pause warning:', err);
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playLaser() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (err) {
      console.warn('playLaser failed:', err);
    }
  }

  public playCorrectHit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.05); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.warn('playCorrectHit failed:', err);
    }
  }

  public playWordExplosion() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        try {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);

          gain.gain.setValueAtTime(0.15, now + idx * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.25);
        } catch (innerErr) {
          console.warn('playWordExplosion inner note failed:', innerErr);
        }
      });
    } catch (err) {
      console.warn('playWordExplosion failed:', err);
    }
  }

  public playWrongBuzz() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (err) {
      console.warn('playWrongBuzz failed:', err);
    }
  }

  public playHeartUp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        try {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.2);
        } catch (innerErr) {
          console.warn('playHeartUp inner note failed:', innerErr);
        }
      });
    } catch (err) {
      console.warn('playHeartUp failed:', err);
    }
  }

  public playMissedHit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (err) {
      console.warn('playMissedHit failed:', err);
    }
  }

  public playGameOver() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [300, 260, 220, 180].forEach((freq, idx) => {
        try {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.2, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.3);
        } catch (innerErr) {
          console.warn('playGameOver inner note failed:', innerErr);
        }
      });
    } catch (err) {
      console.warn('playGameOver failed:', err);
    }
  }

  public playStageClear() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Upbeat triumphant arpeggio: C5 -> E5 -> G5 -> C6
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        try {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.18, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        } catch (innerErr) {
          console.warn('playStageClear inner note failed:', innerErr);
        }
      });
    } catch (err) {
      console.warn('playStageClear failed:', err);
    }
  }

  public playVictory() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Royal victory fanfare: C5 -> E5 -> G5 -> C6 -> E6 -> G6
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        try {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0.22, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.5);
        } catch (innerErr) {
          console.warn('playVictory inner note failed:', innerErr);
        }
      });
    } catch (err) {
      console.warn('playVictory failed:', err);
    }
  }

  public speakWord(word: string, audioUrl?: string) {
    if (this.isMuted) return;

    if (audioUrl) {
      try {
        if (this.currentAudio) {
          this.currentAudio.pause();
        }
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.play().catch(() => {
          this.fallbackSpeech(word);
        });
        return;
      } catch (err) {
        console.warn('speakWord audio play failed, falling back to speech:', err);
        this.fallbackSpeech(word);
        return;
      }
    }

    this.fallbackSpeech(word);
  }

  private fallbackSpeech(word: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('fallbackSpeech synthesis failed:', err);
      }
    }
  }

  public destroy() {
    if (this.ctx) {
      try {
        this.ctx.close().catch(() => {});
      } catch (err) {
        console.warn('destroy audioCtx failed:', err);
      }
      this.ctx = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch (err) {
        console.warn('destroy currentAudio failed:', err);
      }
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('destroy cancel speech failed:', err);
      }
    }
  }
}

export const soundManager = new SoundManager();
