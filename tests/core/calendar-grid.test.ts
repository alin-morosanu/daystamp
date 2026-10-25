import moment from 'moment';
import { describe, expect, it } from 'vitest';

import { buildMonthGrid, moveFocus, resolveWeekStart, weekdayOrder } from '../../src/core/calendar-grid';

const TODAY = moment('2026-10-25T14:30:00');
const day = (s: string) => moment(`${s}T00:00:00`);
const fmt = (m: moment.Moment | null) => m?.format('YYYY-MM-DD') ?? null;

describe('resolveWeekStart', () => {
  it('uses the locale unless overridden', () => {
    expect(resolveWeekStart('locale', 1)).toBe(1);
    expect(resolveWeekStart(0, 1)).toBe(0);
  });
});

describe('weekdayOrder', () => {
  it('rotates weekdays from the week start', () => {
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('buildMonthGrid', () => {
  it('returns 42 cells starting on the week start', () => {
    const cells = buildMonthGrid(TODAY, 1, TODAY);
    expect(cells).toHaveLength(42);
    expect(fmt(cells[0]?.date ?? null)).toBe('2026-09-28');
    expect(cells[0]?.date.day()).toBe(1);
  });

  it('starts on Sunday when asked', () => {
    const cells = buildMonthGrid(TODAY, 0, TODAY);
    expect(fmt(cells[0]?.date ?? null)).toBe('2026-09-27');
  });

  it('marks in-month days and today', () => {
    const cells = buildMonthGrid(TODAY, 1, TODAY);
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
    const today = cells.filter((c) => c.isToday);
    expect(today.map((c) => fmt(c.date))).toEqual(['2026-10-25']);
  });

  it('handles a month starting on the week start', () => {
    const cells = buildMonthGrid(day('2026-06-10'), 1, TODAY);
    expect(fmt(cells[0]?.date ?? null)).toBe('2026-06-01');
  });
});

describe('moveFocus', () => {
  const opts = { weekStart: 1, rtl: false, today: TODAY };
  const move = (from: string, key: string, shiftKey = false, o = opts) =>
    fmt(moveFocus(day(from), { key, shiftKey }, o));

  it('moves by day and week with arrow keys', () => {
    expect(move('2026-10-25', 'ArrowLeft')).toBe('2026-10-24');
    expect(move('2026-10-25', 'ArrowRight')).toBe('2026-10-26');
    expect(move('2026-10-25', 'ArrowUp')).toBe('2026-10-18');
    expect(move('2026-10-31', 'ArrowDown')).toBe('2026-11-07');
  });

  it('swaps left and right in RTL', () => {
    const rtl = { ...opts, rtl: true };
    expect(move('2026-10-25', 'ArrowLeft', false, rtl)).toBe('2026-10-26');
    expect(move('2026-10-25', 'ArrowRight', false, rtl)).toBe('2026-10-24');
  });

  it('goes to the start and end of the week with Home and End', () => {
    // 2026-10-25 is a Sunday: the last day of a Monday-start week.
    expect(move('2026-10-25', 'Home')).toBe('2026-10-19');
    expect(move('2026-10-25', 'End')).toBe('2026-10-25');
    expect(move('2026-10-25', 'Home', false, { ...opts, weekStart: 0 })).toBe('2026-10-25');
    expect(move('2026-10-25', 'End', false, { ...opts, weekStart: 0 })).toBe('2026-10-31');
  });

  it('changes month and year with PageUp/PageDown, clamping the day', () => {
    expect(move('2026-03-31', 'PageUp')).toBe('2026-02-28');
    expect(move('2026-01-31', 'PageDown')).toBe('2026-02-28');
    expect(move('2028-02-29', 'PageDown', true)).toBe('2029-02-28');
    expect(move('2026-10-25', 'PageUp', true)).toBe('2025-10-25');
  });

  it('jumps to today with T', () => {
    expect(move('2020-01-01', 't')).toBe('2026-10-25');
    expect(move('2020-01-01', 'T')).toBe('2026-10-25');
  });

  it('returns null for other keys', () => {
    expect(move('2026-10-25', 'a')).toBeNull();
    expect(move('2026-10-25', 'Enter')).toBeNull();
  });
});
