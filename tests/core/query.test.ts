import moment from 'moment';
import { describe, expect, it } from 'vitest';

import {
  buildTriggerPattern,
  escapeRegExp,
  filterPresets,
  findTrigger,
  isInBlockedSection,
  isInInlineCode,
  MAX_TRIGGER_WINDOW,
  parseTriggerQuery
} from '../../src/core/query';
import type { QueryParser } from '../../src/core/query';
import { createDefaultSettings } from '../../src/core/settings-schema';

const NOW = moment('2026-10-25T14:30:00');

describe('parseTriggerQuery', () => {
  it('parses signed offsets', () => {
    expect(parseTriggerQuery('+3', NOW)).toEqual({
      offsetDays: 3,
      filter: '',
      label: { kind: 'offset', days: 3 }
    });
    expect(parseTriggerQuery('-1', NOW).offsetDays).toBe(-1);
  });

  it('treats unsigned digits as a forward offset', () => {
    expect(parseTriggerQuery('7', NOW).offsetDays).toBe(7);
  });

  it('combines an offset with filter text', () => {
    expect(parseTriggerQuery('+3 day', NOW)).toMatchObject({ offsetDays: 3, filter: 'day' });
    expect(parseTriggerQuery('+3day', NOW)).toMatchObject({ offsetDays: 3, filter: 'day' });
  });

  it('does not treat more than 3 digits as an offset', () => {
    expect(parseTriggerQuery('+1234', NOW)).toEqual({ offsetDays: 0, filter: '+1234', label: null });
  });

  it('treats plain text as a filter', () => {
    expect(parseTriggerQuery('time', NOW)).toEqual({ offsetDays: 0, filter: 'time', label: null });
    expect(parseTriggerQuery('', NOW)).toEqual({ offsetDays: 0, filter: '', label: null });
  });

  it('ignores a lone sign while the number is still being typed', () => {
    expect(parseTriggerQuery('+', NOW)).toEqual({ offsetDays: 0, filter: '', label: null });
  });

  it('uses the first parser that matches', () => {
    const custom: QueryParser = { id: 'x', parse: () => ({ offsetDays: 9, filter: '', label: null }) };
    expect(parseTriggerQuery('+1', NOW, [custom]).offsetDays).toBe(9);
    expect(parseTriggerQuery('+1', NOW, []).filter).toBe('+1');
  });
});

describe('escapeRegExp', () => {
  it('makes regex-special triggers literal', () => {
    const re = new RegExp(`^${escapeRegExp('(.*)+')}$`, 'u');
    expect(re.test('(.*)+')).toBe(true);
    expect(re.test('abc')).toBe(false);
  });
});

describe('findTrigger', () => {
  const pattern = buildTriggerPattern('@@');
  const find = (line: string, ch = line.length) => findTrigger(line, ch, '@@', pattern);

  it('finds the trigger and query before the cursor', () => {
    expect(find('Due @@')).toEqual({ start: 4, query: '' });
    expect(find('Due @@+3 day')).toEqual({ start: 4, query: '+3 day' });
    expect(find('@@mâine')).toEqual({ start: 0, query: 'mâine' });
  });

  it('returns null without a trigger, or when text breaks the query', () => {
    expect(find('nothing here')).toBeNull();
    expect(find('@@ two words')).toBeNull();
  });

  it('only looks at text before the cursor', () => {
    expect(find('ab @@', 3)).toBeNull();
    expect(find('@@x tail', 3)).toEqual({ start: 0, query: 'x' });
  });

  it('ignores a trigger further back than the window', () => {
    const line = `@@${'a'.repeat(MAX_TRIGGER_WINDOW)}`;
    expect(find(line)).toBeNull();
  });

  it('treats a regex-special trigger literally', () => {
    const special = '(.*)+';
    const p = buildTriggerPattern(special);
    expect(findTrigger('x (.*)+3', 8, special, p)).toEqual({ start: 2, query: '3' });
    expect(findTrigger('anything', 8, special, p)).toBeNull();
  });
});

describe('isInInlineCode', () => {
  it('detects an open backtick before the index', () => {
    expect(isInInlineCode('a `code @@', 8)).toBe(true);
    expect(isInInlineCode('a `code` @@', 9)).toBe(false);
    expect(isInInlineCode('@@', 0)).toBe(false);
  });
});

describe('isInBlockedSection', () => {
  const section = (type: string, start: number, end: number) => ({
    type,
    position: { start: { line: start }, end: { line: end } }
  });

  it('blocks code blocks and frontmatter only', () => {
    const sections = [section('yaml', 0, 2), section('paragraph', 3, 3), section('code', 5, 8)];
    expect(isInBlockedSection(sections, 1)).toBe(true);
    expect(isInBlockedSection(sections, 3)).toBe(false);
    expect(isInBlockedSection(sections, 8)).toBe(true);
    expect(isInBlockedSection(sections, 9)).toBe(false);
  });

  it('allows everything when there is no cache', () => {
    expect(isInBlockedSection(undefined, 0)).toBe(false);
  });
});

describe('filterPresets', () => {
  const presets = [
    ...createDefaultSettings().presets,
    { id: 'm', name: 'Mâine', format: 'L', offsetDays: 1, transforms: [] }
  ];

  it('filters case-insensitively by name', () => {
    expect(filterPresets(presets, 'TIME').map((p) => p.id)).toEqual(['date-time', 'date-time-day']);
  });

  it('matches names with diacritics, including decomposed input', () => {
    expect(filterPresets(presets, 'mâine').map((p) => p.id)).toEqual(['m']);
    expect(filterPresets(presets, 'mâine').map((p) => p.id)).toEqual(['m']);
  });

  it('keeps everything for an empty filter', () => {
    expect(filterPresets(presets, '')).toHaveLength(presets.length);
  });
});
