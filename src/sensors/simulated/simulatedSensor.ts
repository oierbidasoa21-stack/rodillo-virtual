import { SensorBase } from '../sensorBase';
import type { SensorKind } from '../types';
import { type SimClock, realClock } from './clock';

/** Simulated sensors send one packet per second, like most real ones. */
export const SIM_PACKET_MS = 1000;

/**
 * Shared lifecycle of simulated sensors: connect, a 1 Hz packet loop, and
 * `simulateDrop` to rehearse a lost connection without hardware.
 */
export abstract class SimulatedSensor<K extends SensorKind> extends SensorBase<K> {
  private loop: unknown = null;
  private dropTimer: unknown = null;

  constructor(
    kind: K,
    private readonly name: string,
    protected readonly clock: SimClock = realClock,
  ) {
    super(kind, 'simulated');
  }

  /** Produces and emits one packet. `dtSec` is the time since the previous one. */
  protected abstract tick(dtSec: number): void;
  /** Resets the simulated physiology/mechanics on a fresh connect. */
  protected abstract reset(): void;

  async connect(): Promise<void> {
    if (this.status === 'connected') return;
    this.setStatus('connecting');
    this.reset();
    this._deviceName = this.name;
    this.setStatus('connected');
    this.startLoop();
  }

  async disconnect(): Promise<void> {
    this.stopLoop();
    this.clock.clearTimeout(this.dropTimer);
    this.dropTimer = null;
    this._deviceName = null;
    this.setStatus('disconnected');
  }

  /** Stops sending for `ms`, reporting `reconnecting`, then resumes. */
  simulateDrop(ms = 5000): void {
    if (this.status !== 'connected') return;
    this.stopLoop();
    this.setStatus('reconnecting');
    this.dropTimer = this.clock.setTimeout(() => {
      this.dropTimer = null;
      this.setStatus('connected');
      this.startLoop();
    }, ms);
  }

  private startLoop(): void {
    this.stopLoop();
    this.loop = this.clock.setInterval(() => this.tick(SIM_PACKET_MS / 1000), SIM_PACKET_MS);
  }

  private stopLoop(): void {
    if (this.loop !== null) this.clock.clearInterval(this.loop);
    this.loop = null;
  }
}
