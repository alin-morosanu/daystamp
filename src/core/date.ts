import type { Moment } from 'moment';

import type { Preset } from './types';

/**
 * The single place a date is resolved: `now` shifted by the preset offset plus `extraOffset`
 * whole calendar days, keeping the local time of day across DST changes. Never mutates `now`.
 */
export function resolveDate(now: Moment, preset: Pick<Preset, 'offsetDays'>, extraOffset = 0): Moment {
  return now.clone().add(preset.offsetDays + extraOffset, 'days');
}

/** The calendar day of `day` at the time of day of `now` (calendar picks keep the current time). */
export function atTimeOfDay(day: Moment, now: Moment): Moment {
  return day.clone().set({
    hour: now.hour(),
    minute: now.minute(),
    second: now.second(),
    millisecond: now.millisecond()
  });
}
