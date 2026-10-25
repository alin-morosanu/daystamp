import type { Moment } from 'moment';

export interface Preset {
  /** Random and stable forever; used in command ids so hotkeys survive renames. */
  readonly id: string;
  readonly name: string;
  /** moment format; literal text goes in [brackets]. */
  readonly format: string;
  readonly offsetDays: number;
  /** Ids from the TRANSFORMS registry in format.ts, applied in registry order. */
  readonly transforms: ReadonlyArray<string>;
}

export type WeekStartSetting = 'locale' | 0 | 1;

export interface Settings {
  readonly settingsVersion: 1;
  readonly presets: ReadonlyArray<Preset>;
  readonly defaultPresetId: string;
  /** "" means auto: the Daily Notes format, else YYYY-MM-DD. */
  readonly linkTargetFormat: string;
  readonly triggerEnabled: boolean;
  readonly spaceAfter: boolean;
  readonly trigger: string;
  readonly showCalendarRibbon: boolean;
  readonly weekStartsOn: WeekStartSetting;
  /** Reserved for v2 most-used ordering. Always a null-prototype object. */
  readonly usage: Readonly<Record<string, number>>;
}

/** `error` is an unexpected exception caught at the insert boundary. */
export type InsertFailure = 'empty-format' | 'invalid-date' | 'no-editor' | 'error';

export type InsertResult =
  { readonly ok: true; readonly text: string } | { readonly ok: false; readonly reason: InsertFailure };

export interface CalendarCell {
  readonly date: Moment;
  readonly inMonth: boolean;
  readonly isToday: boolean;
}
