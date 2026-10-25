import moment from 'moment';
import 'moment/locale/ro';
import { afterEach, describe, expect, it } from 'vitest';

import { hasRiskyLinkChars, hasTimeTokens, render, sanitizeLinkTarget } from '../../src/core/format';
import type { Preset } from '../../src/core/types';

const NOW = moment('2026-10-25T14:30:00');
const preset = (format: string, transforms: string[] = []): Preset => ({
  id: 'p',
  name: 'P',
  format,
  offsetDays: 0,
  transforms
});

describe('render', () => {
  afterEach(() => {
    moment.locale('en');
  });

  it('formats with the preset format', () => {
    expect(render(preset('YYYY-MM-DD HH:mm'), NOW, '')).toEqual({ ok: true, text: '2026-10-25 14:30' });
  });

  it('keeps bracketed literals', () => {
    expect(render(preset('[at] HH:mm'), NOW, '')).toEqual({ ok: true, text: 'at 14:30' });
  });

  it('rejects empty formats', () => {
    expect(render(preset('  '), NOW, '')).toEqual({ ok: false, reason: 'empty-format' });
  });

  it('never renders "Invalid date"', () => {
    expect(render(preset('YYYY'), moment.invalid(), '')).toEqual({ ok: false, reason: 'invalid-date' });
  });

  it('follows the global moment locale', () => {
    moment.locale('ro');
    expect(render(preset('dddd'), moment('2026-10-25T14:30:00'), '')).toEqual({ ok: true, text: 'duminică' });
  });

  describe('wiki-link transform', () => {
    it('links to the daily note with the formatted text as alias', () => {
      expect(render(preset('YYYY-MM-DD HH:mm', ['wiki-link']), NOW, 'YYYY-MM-DD')).toEqual({
        ok: true,
        text: '[[2026-10-25|2026-10-25 14:30]]'
      });
    });

    it('drops the alias when target and text are equal', () => {
      expect(render(preset('YYYY-MM-DD', ['wiki-link']), NOW, '')).toEqual({
        ok: true,
        text: '[[2026-10-25]]'
      });
    });

    it('supports folder formats', () => {
      expect(render(preset('YYYY-MM-DD', ['wiki-link']), NOW, 'YYYY/MM/YYYY-MM-DD')).toEqual({
        ok: true,
        text: '[[2026/10/2026-10-25|2026-10-25]]'
      });
    });

    it('cannot break out of the link markup', () => {
      const result = render(preset('[x]] [y]', ['wiki-link']), NOW, '[a|b]]]');
      expect(result).toEqual({ ok: true, text: '[[ab|x y]]' });
    });
  });
});

describe('sanitizeLinkTarget', () => {
  it('strips [ ] and |', () => {
    expect(sanitizeLinkTarget('[[a|b]]')).toBe('ab');
  });
});

describe('hasRiskyLinkChars', () => {
  it('flags : \\ # ^ but not /', () => {
    for (const c of [':', '\\', '#', '^']) expect(hasRiskyLinkChars(`a${c}b`)).toBe(true);
    expect(hasRiskyLinkChars('2026/10/25')).toBe(false);
  });
});

describe('hasTimeTokens', () => {
  it('detects time tokens outside literals', () => {
    expect(hasTimeTokens('YYYY-MM-DD HH:mm')).toBe(true);
    expect(hasTimeTokens('LT')).toBe(true);
    expect(hasTimeTokens('YYYY-MM-DD dddd')).toBe(false);
    expect(hasTimeTokens('[hh:mm] YYYY')).toBe(false);
  });
});
