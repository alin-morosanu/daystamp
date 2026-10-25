import { describe, expect, it } from 'vitest';

import {
  addPreset,
  findPreset,
  getDefaultPreset,
  movePreset,
  orderDefaultFirst,
  removePreset,
  resetPresets,
  restorePreset,
  setTransform,
  updatePreset
} from '../../src/core/presets';
import { createDefaultSettings, MAX_PRESETS } from '../../src/core/settings-schema';

const base = createDefaultSettings();
const ids = (s: typeof base) => s.presets.map((p) => p.id);

describe('getDefaultPreset', () => {
  it('returns the default preset', () => {
    expect(getDefaultPreset({ ...base, defaultPresetId: 'tomorrow' }).id).toBe('tomorrow');
  });

  it('falls back to the first preset when the id is stale', () => {
    expect(getDefaultPreset({ ...base, defaultPresetId: 'gone' }).id).toBe('date');
  });
});

describe('orderDefaultFirst', () => {
  it('puts the default first and keeps the rest in order', () => {
    const s = { ...base, defaultPresetId: 'date-day' };
    expect(orderDefaultFirst(s).map((p) => p.id)).toEqual([
      'date-day',
      'date',
      'date-time',
      'date-time-day',
      'tomorrow'
    ]);
  });
});

describe('addPreset', () => {
  it('appends a preset with a fresh id without mutating the input', () => {
    const next = addPreset(base, { name: 'New', format: 'L', offsetDays: 0, transforms: [] });
    expect(next.presets).toHaveLength(6);
    expect(base.presets).toHaveLength(5);
    expect(ids(base)).not.toContain(next.presets[5]?.id);
  });

  it('does nothing at the preset limit', () => {
    let s = base;
    for (let i = 0; i < MAX_PRESETS + 5; i++)
      s = addPreset(s, { name: 'x', format: 'L', offsetDays: 0, transforms: [] });
    expect(s.presets).toHaveLength(MAX_PRESETS);
  });
});

describe('removePreset', () => {
  it('removes a preset', () => {
    expect(ids(removePreset(base, 'date-time'))).toEqual(['date', 'date-day', 'date-time-day', 'tomorrow']);
  });

  it('moves the default to the first remaining preset', () => {
    const next = removePreset(base, 'date');
    expect(next.defaultPresetId).toBe('date-time');
  });

  it('refuses to remove the last preset', () => {
    let s = base;
    for (const id of ids(base)) s = removePreset(s, id);
    expect(s.presets).toHaveLength(1);
  });

  it('ignores unknown ids', () => {
    expect(removePreset(base, 'nope')).toBe(base);
  });
});

describe('restorePreset', () => {
  it('puts a removed preset back at its index with the same id', () => {
    const removed = findPreset(base, 'date-time');
    if (!removed) throw new Error('fixture');
    const next = restorePreset(removePreset(base, 'date-time'), removed, 1);
    expect(ids(next)).toEqual(ids(base));
  });

  it('does not duplicate an existing id', () => {
    const preset = findPreset(base, 'date');
    if (!preset) throw new Error('fixture');
    expect(restorePreset(base, preset, 0)).toBe(base);
  });
});

describe('movePreset', () => {
  it('moves a preset to a new index', () => {
    expect(ids(movePreset(base, 0, 2))).toEqual([
      'date-time',
      'date-day',
      'date',
      'date-time-day',
      'tomorrow'
    ]);
    expect(ids(movePreset(base, 4, 0))).toEqual([
      'tomorrow',
      'date',
      'date-time',
      'date-day',
      'date-time-day'
    ]);
  });

  it('ignores out-of-range moves', () => {
    expect(movePreset(base, 0, 9)).toBe(base);
    expect(movePreset(base, -1, 0)).toBe(base);
    expect(movePreset(base, 1, 1)).toBe(base);
  });
});

describe('updatePreset', () => {
  it('patches one preset and clamps the offset', () => {
    const next = updatePreset(base, 'date', { name: 'Day', offsetDays: 99999 });
    expect(findPreset(next, 'date')).toMatchObject({ name: 'Day', offsetDays: 3650 });
    expect(findPreset(base, 'date')?.name).toBe('Date');
  });

  it('ignores unknown ids', () => {
    expect(updatePreset(base, 'nope', { name: 'x' })).toBe(base);
  });
});

describe('setTransform', () => {
  it('turns a transform on and off', () => {
    const on = setTransform(base, 'date', 'wiki-link', true);
    expect(findPreset(on, 'date')?.transforms).toEqual(['wiki-link']);
    const off = setTransform(on, 'date', 'wiki-link', false);
    expect(findPreset(off, 'date')?.transforms).toEqual([]);
  });
});

describe('resetPresets', () => {
  it('restores the default presets and default id but keeps other settings', () => {
    const changed = { ...removePreset(base, 'date'), trigger: ';;' };
    const next = resetPresets(changed);
    expect(ids(next)).toEqual(ids(base));
    expect(next.defaultPresetId).toBe('date');
    expect(next.trigger).toBe(';;');
  });
});
