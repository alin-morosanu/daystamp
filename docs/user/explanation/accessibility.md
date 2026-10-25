# Accessibility

Daystamp aims to meet WCAG 2.2 AA for everything it draws itself: the calendar, the preset editor and its settings.

## Everything works from the keyboard

- Every action is also a command, so the command palette is always an alternative to the mouse, the ribbon and the `@@` list.
- The calendar is fully keyboard-operable. See [calendar keys](../reference/calendar.md#keyboard).
- The single-key shortcut **T** (today) only works while the calendar grid has focus, never in a text field.

## Screen readers

- The calendar follows the ARIA date-grid pattern. Each day is announced with its full date ("Sunday, October 25, 2026"), today is marked as the current date, and the selected day as selected.
- Changing month is announced. The preview of what will be inserted is attached to the grid, so it's read on request rather than on every move.
- Every input and icon button has a name that includes the preset, for example "Format for preset Date+Time".
- Previews and warnings are linked to their inputs, so they're read when the input gets focus.

## Visual

- Today, the selected day and the default preset are each marked by more than colour: a ring, a fill, bold text, a "Default" badge.
- Warnings use an icon and text, never colour alone.
- Only your theme's colours are used, and Windows High Contrast (forced colours) mode is supported.
- Sizes scale with Obsidian's font size and hold at 200% zoom.
- Daystamp adds no animations of its own.

## Known limits

The `@@` list is drawn by Obsidian, so Daystamp can't control all of its behaviour with assistive technology. Use the commands or the calendar if the list doesn't work well for you.

Found a barrier? Please [open an issue](https://github.com/alin-morosanu/daystamp/issues).
