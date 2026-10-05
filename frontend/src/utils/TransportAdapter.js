/**
 * TransportAdapter.js — Unified Real-time Abstraction Layer for OnBoard
 *
 * Provides a clean interface for message synchronization, decoupling the UI
 * from transport mechanics (Adaptive Polling -> WebSockets -> Server-Sent Events).
 *
 * Automatically adapts sync frequency:
 * - Active view: 2.5s
 * - Idle / Background: Pauses on document.hidden
 * - Reconnection: Immediate fetch upon regaining focus or network online
 */

export class BaseTransportAdapter {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in transport listener for ${event}:`, err);
        }
      });
    }
  }

  start() {
    throw new Error("start() must be implemented by subclass");
  }

  stop() {
    throw new Error("stop() must be implemented by subclass");
  }
}

export class AdaptivePollingAdapter extends BaseTransportAdapter {
  constructor(options = {}) {
    super();
    this.activeIntervalMs = options.activeIntervalMs || 2500;
    this.idleIntervalMs = options.idleIntervalMs || 10000;
    this.fetchFn = options.fetchFn || null;

    this.timerId = null;
    this.isRunning = false;
    this.isDocumentVisible = !document.hidden;
    this.isNetworkOnline = navigator.onLine;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    this.scheduleNextTick(0);
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  setFetchFunction(fn) {
    this.fetchFn = fn;
  }

  handleVisibilityChange() {
    this.isDocumentVisible = !document.hidden;
    if (this.isDocumentVisible && this.isRunning) {
      // Immediate sync upon regaining focus
      this.scheduleNextTick(0);
    }
  }

  handleOnline() {
    this.isNetworkOnline = true;
    this.emit("connection_change", { status: "online" });
    if (this.isRunning) {
      this.scheduleNextTick(0);
    }
  }

  handleOffline() {
    this.isNetworkOnline = false;
    this.emit("connection_change", { status: "offline" });
  }

  async triggerSync() {
    if (!this.isRunning || !this.isDocumentVisible || !this.isNetworkOnline) {
      return;
    }

    if (this.fetchFn) {
      try {
        const result = await this.fetchFn();
        this.emit("sync_success", result);
      } catch (err) {
        this.emit("sync_error", err);
      }
    }
  }

  scheduleNextTick(delayMs = null) {
    if (!this.isRunning) return;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    const interval = delayMs !== null
      ? delayMs
      : (this.isDocumentVisible ? this.activeIntervalMs : this.idleIntervalMs);

    this.timerId = setTimeout(async () => {
      await this.triggerSync();
      if (this.isRunning) {
        this.scheduleNextTick();
      }
    }, interval);
  }
}
