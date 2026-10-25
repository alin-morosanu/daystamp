import { getDefaultPreset } from '../core/presets';
import { buildTriggerPattern } from '../core/query';
import type { Preset, Settings } from '../core/types';

export const SAVE_DEBOUNCE_MS = 500;

/** Values derived once per settings change so hot paths only read. */
export interface Derived {
  readonly triggerPattern: RegExp;
  readonly presetsById: ReadonlyMap<string, Preset>;
  readonly defaultPreset: Preset;
}

export type ChangeListener = (prev: Settings, next: Settings) => void;

/** The only owner of Settings: immutable updates, change listeners, debounced persistence. */
export class SettingsStore {
  private settings: Settings;
  private derived: Derived;
  private readonly listeners = new Set<ChangeListener>();
  private saveTimer: number | null = null;

  constructor(
    initial: Settings,
    private readonly persist: (settings: Settings) => Promise<void>,
    private readonly delayMs = SAVE_DEBOUNCE_MS
  ) {
    this.settings = initial;
    this.derived = derive(initial, null);
  }

  get(): Settings {
    return this.settings;
  }

  getDerived(): Derived {
    return this.derived;
  }

  /** Applies an immutable update, notifies listeners now and saves after the debounce. */
  update(fn: (settings: Settings) => Settings): void {
    if (this.apply(fn(this.settings))) this.scheduleSave();
  }

  /** Swaps in settings that are already persisted (e.g. changed by Sync); notifies without saving. */
  replace(next: Settings): void {
    this.apply(next);
  }

  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Saves right away if a save is pending (settings tab hidden, plugin unload). */
  async flush(): Promise<void> {
    if (this.saveTimer === null) return;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await this.save();
  }

  private apply(next: Settings): boolean {
    const prev = this.settings;
    if (next === prev) return false;
    this.settings = next;
    this.derived = derive(next, prev.trigger === next.trigger ? this.derived : null);
    for (const listener of this.listeners) listener(prev, next);
    return true;
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.save();
    }, this.delayMs);
  }

  private async save(): Promise<void> {
    try {
      await this.persist(this.settings);
    } catch (err) {
      console.error('[daystamp] could not save settings', err);
    }
  }
}

function derive(settings: Settings, previous: Derived | null): Derived {
  return {
    // The regex is the only costly part; rebuild it only when the trigger changed.
    triggerPattern: previous?.triggerPattern ?? buildTriggerPattern(settings.trigger),
    presetsById: new Map(settings.presets.map((p) => [p.id, p])),
    defaultPreset: getDefaultPreset(settings)
  };
}
