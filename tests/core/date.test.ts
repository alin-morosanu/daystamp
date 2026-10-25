import moment from 'moment';
import { describe, expect, it } from 'vitest';

import { atTimeOfDay, resolveDate } from '../../src/core/date';

const NOW = moment('2026-10-25T14:30:00');

describe('resolveDate', () => {
  it('returns now when there is no offset', () => {
    expect(resolveDate(NOW, { offsetDays: 0 }).format('YYYY-MM-DD HH:mm')).toBe('2026-10-25 14:30');
  });

  it('adds the preset offset and the extra offset', () => {
    expect(resolveDate(NOW, { offsetDays: 1 }, 2).format('YYYY-MM-DD')).toBe('2026-10-28');
    expect(resolveDate(NOW, { offsetDays: 0 }, -1).format('YYYY-MM-DD')).toBe('2026-10-24');
  });

  it('does not mutate now', () => {
    resolveDate(NOW, { offsetDays: 5 });
    expect(NOW.format('YYYY-MM-DD')).toBe('2026-10-25');
  });

  it('keeps the local time of day across a DST change', () => {
    // Whatever the machine's zone, adding calendar days must preserve the wall-clock time.
    const before = moment('2026-03-28T14:30:00');
    expect(resolveDate(before, { offsetDays: 1 }).format('YYYY-MM-DD HH:mm')).toBe('2026-03-29 14:30');
    const autumn = moment('2026-10-24T14:30:00');
    expect(resolveDate(autumn, { offsetDays: 1 }).format('YYYY-MM-DD HH:mm')).toBe('2026-10-25 14:30');
  });
});

describe('atTimeOfDay', () => {
  it('keeps the picked day and takes the time from now', () => {
    const day = moment('2026-11-03T00:00:00');
    expect(atTimeOfDay(day, NOW).format('YYYY-MM-DD HH:mm')).toBe('2026-11-03 14:30');
    expect(day.format('HH:mm')).toBe('00:00');
  });
});
