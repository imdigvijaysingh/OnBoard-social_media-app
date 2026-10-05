// 🎨 OnBoard Pulse™ Interaction Engine
// Coordinated Motion + Sound + Haptic feedback with zero external audio assets.

class PulseEngine {
  constructor() {
    this.audioCtx = null;
    this.subscribers = new Set();
    try {
      this.soundEnabled = localStorage.getItem("onboard_pulse_sound") !== "false";
    } catch {
      this.soundEnabled = true;
    }
    try {
      this.hapticEnabled = localStorage.getItem("onboard_pulse_haptic") !== "false";
    } catch {
      this.hapticEnabled = true;
    }

    // Auto-resume / unlock AudioContext on first user interaction anywhere
    if (typeof window !== "undefined") {
      const unlock = () => {
        this.getAudioContext();
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
      };
      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("click", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
    }
  }

  // Lazy-initialize Web Audio Context
  getAudioContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // ----------------------------------------------------
  // HAPTIC FEEDBACK (Mobile / Android supported)
  // ----------------------------------------------------
  vibrate(pattern = 10) {
    if (!this.hapticEnabled) return;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Silently catch unsupported devices
    }
  }

  // ----------------------------------------------------
  // SOUND SYNTHESIS (Zero asset downloads, 0ms latency)
  // ----------------------------------------------------

  // Soft wooden "tuk" (Message Send)
  playTukSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.045);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  // Soft two-note chime (Message Received)
  playChimeSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [659.25, 830.61]; // E5, G#5
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch (e) {}
  }

  // Warm resonant heart pop (Like)
  playLikePopSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Signature Connection Harmonic Triad (Board Accepted)
  playBoardConnectedSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Warm triad: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch (e) {}
  }

  // Rising whoosh + ping (Board Requested)
  playBoardRequestSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: Rising air pulse
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(420, now);
      osc1.frequency.exponentialRampToValueAtTime(720, now + 0.07);

      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Note 2: Crisp confirmation ping
      const pingTime = now + 0.06;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, pingTime);

      gain2.gain.setValueAtTime(0.2, pingTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, pingTime + 0.14);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(pingTime);
      osc2.stop(pingTime + 0.16);
    } catch (e) {}
  }

  // Downward soft tick (Board Rejected)
  playRejectSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Ascending airy chime (Post Published)
  playPostPublishedSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [440, 659.25, 880];
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {}
  }

  // ----------------------------------------------------
  // EVENT DISPATCHER & SUBSCRIPTIONS
  // ----------------------------------------------------
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(type, payload = {}) {
    const event = { type, payload, timestamp: Date.now() };
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("Pulse listener error:", err);
      }
    });
  }

  // ----------------------------------------------------
  // SIGNATURE PULSE ACTIONS
  // ----------------------------------------------------

  // 1. Text message sent
  messageSent(payload = {}) {
    this.playTukSound();
    this.vibrate(8);
    this.emit("MESSAGE_SENT", payload);
  }

  // 2. Text message received
  messageReceived(payload = {}) {
    this.playChimeSound();
    this.vibrate(12);
    this.emit("MESSAGE_RECEIVED", payload);
  }

  // 3. Heart like
  like(payload = {}) {
    this.playLikePopSound();
    this.vibrate(10);
    this.emit("POST_LIKED", payload);
  }

  // 4. Board request sent
  boardRequested(payload = {}) {
    this.playBoardRequestSound();
    this.vibrate(14);
    this.emit("BOARD_REQUESTED", payload);
  }

  // 5. Board accepted (Signature connection event)
  boardAccepted(payload = {}) {
    this.playBoardConnectedSound();
    this.vibrate([14, 40, 20]);
    this.emit("BOARD_ACCEPTED", payload);
  }

  // 6. Board rejected
  boardRejected(payload = {}) {
    this.playRejectSound();
    this.vibrate(10);
    this.emit("BOARD_REJECTED", payload);
  }

  // 7. Post published
  postPublished(payload = {}) {
    this.playPostPublishedSound();
    this.vibrate([10, 30, 15]);
    this.emit("POST_PUBLISHED", payload);
  }

  // 8. General light tactile tap
  tap() {
    this.vibrate(6);
  }

  // ----------------------------------------------------
  // USER PREFERENCE TOGGLES
  // ----------------------------------------------------
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    try {
      localStorage.setItem("onboard_pulse_sound", this.soundEnabled ? "true" : "false");
    } catch {}
    if (this.soundEnabled) this.playLikePopSound();
    return this.soundEnabled;
  }

  toggleHaptic() {
    this.hapticEnabled = !this.hapticEnabled;
    try {
      localStorage.setItem("onboard_pulse_haptic", this.hapticEnabled ? "true" : "false");
    } catch {}
    if (this.hapticEnabled) this.vibrate(15);
    return this.hapticEnabled;
  }

  isSoundActive() {
    return this.soundEnabled;
  }

  isHapticActive() {
    return this.hapticEnabled;
  }
}

// Global Singleton Instance
export const pulse = new PulseEngine();
export default pulse;
