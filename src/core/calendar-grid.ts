import type { Moment } from 'moment';

import type { CalendarCell, WeekStartSetting } from './types';

export const GRID_WEEKS = 6;
export const DAYS_PER_WEEK = 7;

/** 0 = Sunday … 6 = Saturday; `'locale'` uses the locale's first day of week. */
export function resolveWeekStart(setting: WeekStartSetting, localeFirstDay: number): number {
  return setting === 'locale' ? localeFirstDay : setting;
}

/** Weekday numbers (0 = Sunday) in display order for the given week start. */
export function weekdayOrder(weekStart: number): number[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, i) => (weekStart + i) % DAYS_PER_WEEK);
}

/** 6×7 cells covering the month containing `anchor`, starting on `weekStart`; adjacent-month days included. */
export function buildMonthGrid(anchor: Moment, weekStart: number, today: Moment): CalendarCell[] {
  const first = anchor.clone().startOf('month');
  const cursor = first.clone().subtract(daysIntoWeek(first, weekStart), 'days');
  const cells: CalendarCell[] = [];
  for (let i = 0; i < GRID_WEEKS * DAYS_PER_WEEK; i++) {
    const date = cursor.clone();
    cells.push({ date, inMonth: date.month() === first.month(), isToday: date.isSame(today, 'day') });
    cursor.add(1, 'day');
  }
  return cells;
}

export interface FocusKey {
  readonly key: string;
  readonly shiftKey: boolean;
}

export interface FocusOptions {
  readonly weekStart: number;
  readonly rtl: boolean;
  readonly today: Moment;
}

/**
 * The day focus moves to for a key in the calendar grid (ARIA date-grid pattern), or null if the key
 * is not a navigation key. Left/Right swap in RTL; month and year moves clamp to the month's last day.
 */
export function moveFocus(date: Moment, input: FocusKey, opts: FocusOptions): Moment | null {
  const next = date.clone();
  switch (input.key) {
    case 'ArrowLeft':
      return next.add(opts.rtl ? 1 : -1, 'day');
    case 'ArrowRight':
      return next.add(opts.rtl ? -1 : 1, 'day');
    case 'ArrowUp':
      return next.subtract(DAYS_PER_WEEK, 'days');
    case 'ArrowDown':
      return next.add(DAYS_PER_WEEK, 'days');
    case 'Home':
      return next.subtract(daysIntoWeek(date, opts.weekStart), 'days');
    case 'End':
      return next.add(DAYS_PER_WEEK - 1 - daysIntoWeek(date, opts.weekStart), 'days');
    case 'PageUp':
      return next.subtract(1, input.shiftKey ? 'year' : 'month');
    case 'PageDown':
      return next.add(1, input.shiftKey ? 'year' : 'month');
    case 't':
    case 'T':
      return opts.today.clone();
    default:
      return null;
  }
}

function daysIntoWeek(date: Moment, weekStart: number): number {
  return (date.day() - weekStart + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}
