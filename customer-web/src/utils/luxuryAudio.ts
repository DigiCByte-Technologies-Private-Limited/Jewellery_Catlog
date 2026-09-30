/**
 * Web Audio API luxury acoustic sound synthesis.
 * Zero external audio files required — synthesized in real-time.
 */

class LuxurySoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Delicate, crystal-clear metallic chime for noble metal & gemstone selection.
   */
  public playMetallicChime(frequency: number = 880) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Velvet presentation box latch/unboxing sound.
   */
  public playVelvetLatch(isOpen: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startFreq = isOpen ? 120 : 220;
      const endFreq = isOpen ? 220 : 110;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Subtle luxury haptic click for buttons and slider adjustments.
   */
  public playSubtleTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const luxuryAudio = new LuxurySoundEngine();
