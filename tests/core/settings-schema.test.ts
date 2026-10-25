import { describe, expect, it } from 'vitest';

import {
  clampOffset,
  createDefaultSettings,
  createPresetId,
  isValidTrigger,
  MAX_FORMAT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PRESETS,
  migrateSettings,
  PRESET_ID_PATTERN,
  sanitizeSettings
} from '../../src/core/settings-schema';

describe('createDefaultSettings', () => {
  it('ships exactly the five default presets', () => {
    const s = createDefaultSettings();
    expect(s.presets.map((p) => [p.name, p.format, p.offsetDays])).toEqual([
      ['Date', 'YYYY-MM-DD', 0],
      ['Date+Time', 'YYYY-MM-DD HH:mm', 0],
      ['Date+Day', 'YYYY-MM-DD dddd', 0],
      ['Date+Time+Day', 'YYYY-MM-DD HH:mm, dddd', 0],
      ['Tomorrow', 'YYYY-MM-DD', 1]
    ]);
    expect(s.defaultPresetId).toBe('date');
    expect(s.triggerEnabled).toBe(true);
    expect(s.spaceAfter).toBe(false);
    expect(s.trigger).toBe('@@');
  });

  it('returns independent copies', () => {
    const a = createDefaultSettings();
    const b = createDefaultSettings();
    expect(a.presets).not.toBe(b.presets);
    expect(a.presets[0]).not.toBe(b.presets[0]);
  });
});

describe('sanitizeSettings', () => {
  it('returns defaults when data is missing or not an object', () => {
    for (const raw of [undefined, null, 42, 'x', [], true]) {
      expect(sanitizeSettings(raw)).toEqual(createDefaultSettings());
    }
  });

  it('keeps valid saved data and fills missing fields per preset', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: [{ id: 'abc', name: 'Mine' }],
      trigger: ';;',
      spaceAfter: true
    });
    expect(s.presets).toEqual([
      { id: 'abc', name: 'Mine', format: 'YYYY-MM-DD', offsetDays: 0, transforms: [] }
    ]);
    expect(s.defaultPresetId).toBe('abc');
    expect(s.trigger).toBe(';;');
    expect(s.spaceAfter).toBe(true);
  });

  it('falls back to defaults for wrong types', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: 'nope',
      triggerEnabled: 'yes',
      weekStartsOn: 3,
      linkTargetFormat: 7
    });
    const d = createDefaultSettings();
    expect(s.presets).toEqual(d.presets);
    expect(s.triggerEnabled).toBe(true);
    expect(s.weekStartsOn).toBe('locale');
    expect(s.linkTargetFormat).toBe('');
  });

  it('caps the preset count and string lengths', () => {
    const presets = Array.from({ length: 80 }, (_, i) => ({
      id: `p${i}`,
      name: 'n'.repeat(500),
      format: 'Y'.repeat(500)
    }));
    const s = sanitizeSettings({ settingsVersion: 1, presets, linkTargetFormat: 'Y'.repeat(999) });
    expect(s.presets).toHaveLength(MAX_PRESETS);
    expect(s.presets[0]?.name).toHaveLength(MAX_NAME_LENGTH);
    expect(s.presets[0]?.format).toHaveLength(MAX_FORMAT_LENGTH);
    expect(s.linkTargetFormat).toHaveLength(MAX_FORMAT_LENGTH);
  });

  it('replaces invalid, duplicate and __proto__ ids with generated ones', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: [{ id: '__proto__' }, { id: 'ok' }, { id: 'ok' }, { id: 'UPPER' }, { id: 'x'.repeat(40) }, {}]
    });
    const ids = s.presets.map((p) => p.id);
    expect(ids[1]).toBe('ok');
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(PRESET_ID_PATTERN);
  });

  it('clamps huge offsets and truncates fractions', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: [
        { id: 'a', offsetDays: 1e9 },
        { id: 'b', offsetDays: -1e9 },
        { id: 'c', offsetDays: 2.7 },
        { id: 'd', offsetDays: Number.NaN },
        { id: 'e', offsetDays: '5' }
      ]
    });
    expect(s.presets.map((p) => p.offsetDays)).toEqual([3650, -3650, 2, 0, 0]);
  });

  it('keeps only known transforms', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: [{ id: 'a', transforms: ['wiki-link', 'evil', 'wiki-link', 3] }]
    });
    expect(s.presets[0]?.transforms).toEqual(['wiki-link']);
  });

  it('skips non-object presets and falls back to defaults if none are left', () => {
    expect(sanitizeSettings({ settingsVersion: 1, presets: [] }).presets).toHaveLength(5);
    expect(sanitizeSettings({ settingsVersion: 1, presets: [null, 1, 'x'] }).presets).toHaveLength(5);
  });

  it('points a stale default id at the first preset', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: [{ id: 'a' }, { id: 'b' }],
      defaultPresetId: 'gone'
    });
    expect(s.defaultPresetId).toBe('a');
  });

  it('rejects invalid triggers', () => {
    for (const trigger of ['', 'abcdef', 'a b', '\t', 5]) {
      expect(sanitizeSettings({ settingsVersion: 1, trigger }).trigger).toBe('@@');
    }
  });

  it('builds usage with a null prototype and only valid, existing ids', () => {
    const raw = JSON.parse(
      '{"settingsVersion":1,"presets":[{"id":"a"}],"usage":{"__proto__":{"x":1},"a":3,"b":2,"A B":1}}'
    ) as unknown;
    const s = sanitizeSettings(raw);
    expect(Object.getPrototypeOf(s.usage)).toBeNull();
    expect({ ...s.usage }).toEqual({ a: 3 });
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it('drops negative and fractional usage counts', () => {
    const s = sanitizeSettings({
      settingsVersion: 1,
      presets: [{ id: 'a' }, { id: 'b' }],
      usage: { a: -1, b: 1.5 }
    });
    expect({ ...s.usage }).toEqual({});
  });
});

describe('migrateSettings', () => {
  it('turns v0 wrapLink into the wiki-link transform', () => {
    const s = sanitizeSettings({
      presets: [
        { id: 'a', wrapLink: true },
        { id: 'b', wrapLink: false }
      ]
    });
    expect(s.presets.map((p) => p.transforms)).toEqual([['wiki-link'], []]);
    expect(s.settingsVersion).toBe(1);
  });

  it('leaves current-version data unchanged', () => {
    const raw = { settingsVersion: 1, presets: [] };
    expect(migrateSettings(raw)).toBe(raw);
  });

  it('passes through versions newer than the code knows', () => {
    const raw = { settingsVersion: 99 };
    expect(migrateSettings(raw)).toBe(raw);
  });
});

describe('createPresetId', () => {
  it('returns an id matching the pattern and not already taken', () => {
    let n = 0;
    const seq = [0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const random = () => seq[n++ % seq.length] ?? 0;
    const id = createPresetId(new Set(['00000000']), random);
    expect(id).toMatch(PRESET_ID_PATTERN);
    expect(id).not.toBe('00000000');
  });
});

describe('clampOffset', () => {
  it('clamps and truncates', () => {
    expect(clampOffset(4000)).toBe(3650);
    expect(clampOffset(-1.9)).toBe(-1);
    expect(clampOffset(Infinity)).toBe(0);
    expect(clampOffset(undefined)).toBe(0);
  });
});

describe('isValidTrigger', () => {
  it('accepts 1–5 non-whitespace characters', () => {
    expect(isValidTrigger('@')).toBe(true);
    expect(isValidTrigger('(.*)+')).toBe(true);
    expect(isValidTrigger('@@ ')).toBe(false);
    expect(isValidTrigger('123456')).toBe(false);
  });
});
