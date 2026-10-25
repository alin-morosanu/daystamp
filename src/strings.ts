import type { InsertFailure } from './core/types';

/** Every user-facing string. Sentence case, following Obsidian's style. */
export const STRINGS = {
  commands: {
    insertDefault: 'Insert default date',
    openCalendar: 'Insert date from calendar',
    insertPreset: (name: string, format: string) => `Insert ${name} (${format})`
  },
  ribbon: {
    insert: (name: string, format: string) => `Insert ${name} (${format})`,
    calendar: 'Insert date from calendar'
  },
  menu: {
    insert: 'Insert date',
    calendar: 'Insert date from calendar…'
  },
  notices: {
    failure: {
      'no-editor': 'Open a note in editing mode to insert a date',
      'empty-format': 'This preset has an empty format. Set one in settings',
      'invalid-date': 'Could not compute that date, so nothing was inserted',
      error: 'Something went wrong inserting the date. See the developer console for details'
    } satisfies Record<InsertFailure, string>,
    presetDeleted: (name: string) => `Deleted preset "${name}"`,
    presetsReset: 'Presets reset to defaults',
    undo: 'Undo'
  },
  suggest: {
    calendarItem: 'Pick from calendar…',
    calendarHint: 'Choose any day',
    offset: (days: number, preview: string) =>
      `${days > 0 ? '+' : ''}${days} ${Math.abs(days) === 1 ? 'day' : 'days'} → ${preview}`,
    meta: (name: string, format: string) => `${name} · ${format}`,
    defaultBadge: 'default',
    noMatch: 'No preset matches',
    instructionNavigate: 'to navigate',
    instructionInsert: 'to insert',
    instructionDismiss: 'to dismiss'
  },
  calendar: {
    title: 'Insert date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    month: 'Month',
    year: 'Year',
    preset: 'Preset',
    presetHint: "The preset's day offset is added to the picked day.",
    timeHint: 'Uses the current time on the picked day.',
    insert: 'Insert',
    preview: (text: string) => `Will insert: ${text}`,
    previewInvalid: (reason: string) => `Nothing to insert: ${reason}`,
    keyboardHelp:
      'Arrow keys move, Page up/down change month, Shift+Page up/down change year, T goes to today, Enter inserts.'
  },
  settings: {
    headings: {
      presets: 'Presets',
      insert: 'Inserting',
      trigger: 'Inline trigger',
      calendar: 'Calendar',
      links: 'Links'
    },
    presetList: {
      empty: 'No presets',
      add: 'Add preset',
      defaultBadge: 'Default',
      newPresetName: 'New preset',
      editAria: (name: string) => `Edit preset ${name}`,
      cannotDeleteLast: 'Keep at least one preset'
    },
    preset: {
      name: 'Name',
      nameAria: (name: string) => `Name for preset ${name}`,
      format: 'Format',
      formatAria: (name: string) => `Format for preset ${name}`,
      formatDesc: 'Moment.js format. Put literal text in [brackets].',
      formatEmpty: 'The format cannot be empty.',
      preview: (text: string) => `Preview: ${text}`,
      chips: 'Common formats',
      chip: (label: string, format: string) => `Use ${label} format (${format})`,
      offset: 'Day offset',
      offsetDesc: 'Whole days to add, for example 1 for tomorrow or -1 for yesterday.',
      offsetAria: (name: string) => `Day offset for preset ${name}`,
      offsetInvalid: 'Enter a whole number.',
      link: 'Link to daily note',
      linkDesc: "Wrap the date in a [[link]] to that day's note, keeping your format as the alias.",
      linkWarning: (target: string) =>
        `The link target "${target}" contains : \\ # or ^, which Obsidian treats specially in links.`,
      moveUp: 'Move up',
      moveUpAria: (name: string) => `Move preset ${name} up`,
      moveDown: 'Move down',
      moveDownAria: (name: string) => `Move preset ${name} down`,
      makeDefault: 'Make default',
      makeDefaultDesc: 'Used by the ribbon icon, the default command and listed first in the inline trigger.',
      isDefault: 'This is the default preset.'
    },
    chips: [
      { label: 'ISO', format: 'YYYY-MM-DD' },
      { label: 'US', format: 'MM/DD/YYYY' },
      { label: 'EU', format: 'DD.MM.YYYY' },
      { label: 'Week number', format: 'GGGG-[W]WW' },
      { label: 'Time only', format: 'HH:mm' }
    ],
    defaultPreset: 'Default preset',
    defaultPresetDesc: 'Inserted by the ribbon icon and the default command.',
    resetPresets: 'Reset presets to defaults',
    resetPresetsDesc: 'Replaces all presets with the built-in ones. You can undo for a few seconds.',
    formatDocs: 'Format reference',
    formatDocsDesc: 'All moment.js format tokens.',
    formatDocsLink: 'Open the format reference',
    spaceAfter: 'Add space after insert',
    spaceAfterDesc: 'Adds a single space after the inserted date, unless one already follows.',
    triggerEnabled: 'Enable inline trigger',
    triggerEnabledDesc: 'Type the trigger in a note to pick a preset from a list.',
    trigger: 'Trigger',
    triggerDesc: 'One to five characters, no spaces. Add +3 or -1 after it to shift the date.',
    triggerInvalid: 'Use one to five characters without spaces.',
    triggerConflictName: 'Trigger conflict',
    triggerConflict:
      'Natural Language Dates is enabled and also opens a popup after @. The two popups may collide; consider a trigger that does not start with @.',
    showCalendarRibbon: 'Show calendar ribbon icon',
    showCalendarRibbonDesc: 'Adds a second ribbon icon that opens the calendar.',
    weekStart: 'First day of the week',
    weekStartOptions: { locale: 'Follow language', '0': 'Sunday', '1': 'Monday' },
    linkTarget: 'Link target format',
    linkTargetDesc:
      'Format of the daily note name used by "Link to daily note". Leave empty to use your Daily Notes format.',
    linkTargetWarningName: 'Link target warning',
    linkTargetPlaceholder: (format: string) => `Auto (${format})`
  }
} as const;

export type Strings = typeof STRINGS;
