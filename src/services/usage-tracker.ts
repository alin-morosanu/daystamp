import { PRESET_ID_PATTERN } from '../core/settings-schema';
import type { SettingsStore } from './settings-store';

export const USAGE_SAVE_DEBOUNCE_MS = 10_000;

/** Counts inserts per preset in memory and folds them into settings rarely, so inserts never write data.json. */
export class UsageTracker {
  private pending = Object.create(null) as Record<string, number>;
  private timer: number | null = null;

  constructor(
    private readonly store: SettingsStore,
    private readonly delayMs = USAGE_SAVE_DEBOUNCE_MS
  ) {}

  record(presetId: string): void {
    if (!PRESET_ID_PATTERN.test(presetId)) return;
    this.pending[presetId] = (this.pending[presetId] ?? 0) + 1;
    if (this.timer === null) this.timer = window.setTimeout(() => this.flush(), this.delayMs);
  }

  /** Moves pending counts into the store (which then saves on its own debounce). */
  flush(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    const pending = this.pending;
    if (Object.keys(pending).length === 0) return;
    this.pending = Object.create(null) as Record<string, number>;
    this.store.update((s) => {
      const ids = new Set(s.presets.map((p) => p.id));
      const usage = Object.create(null) as Record<string, number>;
      for (const [id, count] of Object.entries(s.usage)) usage[id] = count;
      for (const [id, count] of Object.entries(pending)) {
        if (ids.has(id)) usage[id] = (usage[id] ?? 0) + count;
      }
      return { ...s, usage };
    });
  }

  dispose(): void {
    this.flush();
  }
}
