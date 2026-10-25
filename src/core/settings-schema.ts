import { TRANSFORMS } from './format';
import type { Preset, Settings, WeekStartSetting } from './types';

export const SETTINGS_VERSION = 1;
export const MAX_PRESETS = 50;
export const MAX_NAME_LENGTH = 100;
export const MAX_FORMAT_LENGTH = 200;
export const MAX_OFFSET_DAYS = 3650;
export const MAX_TRIGGER_LENGTH = 5;
export const DEFAULT_TRIGGER = '@@';
export const PRESET_ID_PATTERN = /^[a-z0-9-]{1,32}$/;
export const KNOWN_TRANSFORM_IDS: ReadonlyArray<string> = TRANSFORMS.map((t) => t.id);

const PRESET_ID_LENGTH = 8;
const FALLBACK_FORMAT = 'YYYY-MM-DD';
const FALLBACK_NAME = 'Preset';

export const DEFAULT_PRESETS: ReadonlyArray<Preset> = [
  { id: 'date', name: 'Date', format: 'YYYY-MM-DD', offsetDays: 0, transforms: [] },
  { id: 'date-time', name: 'Date+Time', format: 'YYYY-MM-DD HH:mm', offsetDays: 0, transforms: [] },
  { id: 'date-day', name: 'Date+Day', format: 'YYYY-MM-DD dddd', offsetDays: 0, transforms: [] },
  {
    id: 'date-time-day',
    name: 'Date+Time+Day',
    format: 'YYYY-MM-DD HH:mm, dddd',
    offsetDays: 0,
    transforms: []
  },
  { id: 'tomorrow', name: 'Tomorrow', format: 'YYYY-MM-DD', offsetDays: 1, transforms: [] }
];

/** Fresh default settings; never shares mutable state between calls. */
export function createDefaultSettings(): Settings {
  return {
    settingsVersion: SETTINGS_VERSION,
    presets: DEFAULT_PRESETS.map((p) => ({ ...p, transforms: [...p.transforms] })),
    defaultPresetId: 'date',
    linkTargetFormat: '',
    triggerEnabled: true,
    spaceAfter: false,
    trigger: DEFAULT_TRIGGER,
    showCalendarRibbon: false,
    weekStartsOn: 'locale',
    usage: Object.create(null) as Record<string, number>
  };
}

type RawRecord = Record<string, unknown>;

/**
 * Migrations keyed by the version they upgrade *from*. Unversioned data counts as 0
 * (development builds stored `wrapLink: boolean` instead of `transforms`).
 */
export const MIGRATIONS: Readonly<Record<number, (raw: RawRecord) => RawRecord>> = {
  0: (raw) => ({
    ...raw,
    settingsVersion: 1,
    presets: Array.isArray(raw.presets)
      ? raw.presets.map((p: unknown) =>
          isRecord(p) && p.transforms === undefined
            ? { ...p, transforms: p.wrapLink === true ? ['wiki-link'] : [] }
            : p
        )
      : raw.presets
  })
};

/** Runs migrations from the stored settingsVersion up to SETTINGS_VERSION; unknown or newer versions pass through. */
export function migrateSettings(raw: RawRecord): RawRecord {
  let current = raw;
  let version = typeof current.settingsVersion === 'number' ? current.settingsVersion : 0;
  while (version < SETTINGS_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) break;
    current = migrate(current);
    version += 1;
  }
  return current;
}

/** Validates untrusted data.json content into a fresh Settings object; anything invalid falls back to defaults. */
export function sanitizeSettings(raw: unknown, random: () => number = Math.random): Settings {
  const defaults = createDefaultSettings();
  if (!isRecord(raw)) return defaults;
  const data = migrateSettings(raw);
  const presets = sanitizePresets(data.presets, random) ?? defaults.presets;
  const ids = new Set(presets.map((p) => p.id));
  const firstId = presets[0]?.id ?? defaults.defaultPresetId;
  return {
    settingsVersion: SETTINGS_VERSION,
    presets,
    defaultPresetId:
      typeof data.defaultPresetId === 'string' && ids.has(data.defaultPresetId)
        ? data.defaultPresetId
        : firstId,
    linkTargetFormat: sanitizeFormat(data.linkTargetFormat, defaults.linkTargetFormat),
    triggerEnabled: typeof data.triggerEnabled === 'boolean' ? data.triggerEnabled : defaults.triggerEnabled,
    spaceAfter: typeof data.spaceAfter === 'boolean' ? data.spaceAfter : defaults.spaceAfter,
    trigger: isValidTrigger(data.trigger) ? data.trigger : defaults.trigger,
    showCalendarRibbon:
      typeof data.showCalendarRibbon === 'boolean' ? data.showCalendarRibbon : defaults.showCalendarRibbon,
    weekStartsOn: isWeekStart(data.weekStartsOn) ? data.weekStartsOn : defaults.weekStartsOn,
    usage: sanitizeUsage(data.usage, ids)
  };
}

/** True for a 1–5 character trigger without whitespace. */
export function isValidTrigger(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length >= 1 && value.length <= MAX_TRIGGER_LENGTH && !/\s/u.test(value)
  );
}

/** Generates a preset id matching PRESET_ID_PATTERN that is not in `taken`. */
export function createPresetId(taken: ReadonlySet<string>, random: () => number = Math.random): string {
  for (;;) {
    let id = '';
    while (id.length < PRESET_ID_LENGTH) id += Math.floor(random() * 36).toString(36);
    if (!taken.has(id)) return id;
  }
}

/** Integer day offset clamped to ±MAX_OFFSET_DAYS; non-numbers become 0. */
export function clampOffset(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(-MAX_OFFSET_DAYS, Math.min(MAX_OFFSET_DAYS, Math.trunc(value)));
}

function sanitizePresets(value: unknown, random: () => number): Preset[] | null {
  if (!Array.isArray(value)) return null;
  const taken = new Set<string>();
  const presets: Preset[] = [];
  for (const item of value.slice(0, MAX_PRESETS)) {
    if (!isRecord(item)) continue;
    const id =
      typeof item.id === 'string' && PRESET_ID_PATTERN.test(item.id) && !taken.has(item.id)
        ? item.id
        : createPresetId(taken, random);
    taken.add(id);
    presets.push({
      id,
      name: typeof item.name === 'string' ? item.name.slice(0, MAX_NAME_LENGTH) : FALLBACK_NAME,
      format: sanitizeFormat(item.format, FALLBACK_FORMAT),
      offsetDays: clampOffset(item.offsetDays),
      transforms: sanitizeTransforms(item.transforms)
    });
  }
  return presets.length > 0 ? presets : null;
}

function sanitizeFormat(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.slice(0, MAX_FORMAT_LENGTH) : fallback;
}

function sanitizeTransforms(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return KNOWN_TRANSFORM_IDS.filter((id) => value.includes(id));
}

function sanitizeUsage(value: unknown, ids: ReadonlySet<string>): Record<string, number> {
  const usage = Object.create(null) as Record<string, number>;
  if (!isRecord(value)) return usage;
  for (const [id, count] of Object.entries(value)) {
    if (!PRESET_ID_PATTERN.test(id) || !ids.has(id)) continue;
    if (typeof count === 'number' && Number.isInteger(count) && count > 0) usage[id] = count;
  }
  return usage;
}

function isWeekStart(value: unknown): value is WeekStartSetting {
  return value === 'locale' || value === 0 || value === 1;
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
