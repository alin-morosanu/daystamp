import { clampOffset, createDefaultSettings, createPresetId, MAX_PRESETS } from './settings-schema';
import type { Preset, Settings } from './types';

export type PresetPatch = Partial<Omit<Preset, 'id'>>;

/** The default preset, or the first one if the default id is stale. Settings always hold at least one preset. */
export function getDefaultPreset(settings: Settings): Preset {
  const preset = findPreset(settings, settings.defaultPresetId) ?? settings.presets[0];
  if (!preset) throw new Error('Settings must contain at least one preset');
  return preset;
}

/** The preset with this id, or undefined. */
export function findPreset(settings: Settings, id: string): Preset | undefined {
  return settings.presets.find((p) => p.id === id);
}

/** Presets with the default one first, the rest in list order. */
export function orderDefaultFirst(settings: Settings): Preset[] {
  const first = getDefaultPreset(settings);
  return [first, ...settings.presets.filter((p) => p.id !== first.id)];
}

/** Appends a new preset with a fresh id; no-op at MAX_PRESETS. */
export function addPreset(
  settings: Settings,
  fields: Omit<Preset, 'id'>,
  random: () => number = Math.random
): Settings {
  if (settings.presets.length >= MAX_PRESETS) return settings;
  const id = createPresetId(new Set(settings.presets.map((p) => p.id)), random);
  return { ...settings, presets: [...settings.presets, { id, ...fields }] };
}

/** Puts a previously removed preset back at `index`, keeping its id (used by Undo). */
export function restorePreset(settings: Settings, preset: Preset, index: number): Settings {
  if (findPreset(settings, preset.id) || settings.presets.length >= MAX_PRESETS) return settings;
  const presets = [...settings.presets];
  presets.splice(Math.max(0, Math.min(index, presets.length)), 0, preset);
  return { ...settings, presets };
}

/** Removes a preset; refuses to remove the last one; moves the default to the first preset if needed. */
export function removePreset(settings: Settings, id: string): Settings {
  if (settings.presets.length <= 1) return settings;
  const presets = settings.presets.filter((p) => p.id !== id);
  if (presets.length === settings.presets.length) return settings;
  const first = presets[0];
  const defaultPresetId = settings.defaultPresetId === id && first ? first.id : settings.defaultPresetId;
  return { ...settings, presets, defaultPresetId };
}

/** Moves a preset from one index to another; out-of-range indices are a no-op. */
export function movePreset(settings: Settings, from: number, to: number): Settings {
  const count = settings.presets.length;
  if (from === to || from < 0 || to < 0 || from >= count || to >= count) return settings;
  const presets = [...settings.presets];
  const [moved] = presets.splice(from, 1);
  if (!moved) return settings;
  presets.splice(to, 0, moved);
  return { ...settings, presets };
}

/** Applies a patch to one preset; the offset is clamped like on load. */
export function updatePreset(settings: Settings, id: string, patch: PresetPatch): Settings {
  if (!findPreset(settings, id)) return settings;
  const next =
    patch.offsetDays === undefined ? patch : { ...patch, offsetDays: clampOffset(patch.offsetDays) };
  return { ...settings, presets: settings.presets.map((p) => (p.id === id ? { ...p, ...next } : p)) };
}

/** Replaces all presets with the defaults and makes Date the default preset. */
export function resetPresets(settings: Settings): Settings {
  const defaults = createDefaultSettings();
  return { ...settings, presets: defaults.presets, defaultPresetId: defaults.defaultPresetId };
}

/** Turns one output transform on or off for a preset. */
export function setTransform(
  settings: Settings,
  id: string,
  transformId: string,
  enabled: boolean
): Settings {
  const preset = findPreset(settings, id);
  if (!preset) return settings;
  const others = preset.transforms.filter((t) => t !== transformId);
  return updatePreset(settings, id, { transforms: enabled ? [...others, transformId] : others });
}
