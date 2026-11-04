/**
 * Web Audio API synthesized chimes and notification sounds.
 * 100% self-contained: no external MP3/WAV files required.
 * Designed with soothing, peaceful meditation frequencies (sine waves).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("hid_sound_muted") === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("hid_sound_muted", String(muted));
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  /**
   * Gentle, soothing two-tone bell chime when a new message arrives.
   * Frequencies: 659.25 Hz (E5) -> 880 Hz (A5), soft harmonics with exponential decay.
   */
  public playMessageChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: A5 (harmonious fifth above)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.07, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.9);
    } catch {
      // Audio playback fails safely if user hasn't interacted with page
    }
  }

  /**
   * Soft three-tone chime for supporters when a new conversation ticket enters the queue.
   */
  public playTicketAlert(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (Major triad)

      notes.forEach((freq, index) => {
        const time = now + index * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.09, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.7);
      });
    } catch {
      // Fails silently
    }
  }

  /**
   * Deep, warm singing bowl chime for breathing transitions (432 Hz).
   */
  public playBowlChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(432, now); // Natural healing frequency
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.2);
    } catch {
      // Fails silently
    }
  }

  /**
   * Request browser desktop notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }

  /**
   * Trigger a desktop notification (e.g. when tab is backgrounded)
   */
  public showDesktopNotification(title: string, options?: NotificationOptions): void {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted" && document.hidden) {
      try {
        new Notification(title, {
          icon: "/icons/hithata-idak-logo.png",
          badge: "/favicon.ico",
          ...options,
        });
      } catch {
        // Notification failure fallback
      }
    }
  }
}

export const soundManager = new SoundManager();
