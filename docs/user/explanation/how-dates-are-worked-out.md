# How dates are worked out

Every way of inserting goes through the same steps, so a preset inserts the same thing whether you use the ribbon, a command, `@@` or the calendar.

## Presets are shared

Daystamp has one list of presets. The ribbon, commands, the trigger list and the calendar all read from it. Change a preset once and every entry point follows, including its command name in the palette.

## The steps

1. **Start from a moment in time.** Normally that's *now*, read at the instant you insert, so inserting just before and just after midnight gives different days. In the calendar, it's the day you picked combined with the current time.
2. **Add whole days.** The preset's **day offset** is added, plus any offset typed after the trigger (`@@+3`). Days are calendar days: across a daylight-saving change, `+1` from 14:30 is 14:30 the next day, not 13:30 or 15:30.
3. **Format.** The preset's format turns the date into text, using Obsidian's language for names.
4. **Transform.** If **Link to daily note** is on, the text is wrapped as `[[target|text]]`.
5. **Insert** at the cursor, or over the selection, as one undo step.

## When nothing is inserted

Daystamp never inserts broken text such as "Invalid date". Instead it shows a notice and leaves the note unchanged when:

- no note is open in editing mode,
- the preset's format is empty, or
- the date can't be calculated.

## Why offsets apply in the calendar too

A preset means the same thing everywhere. **Tomorrow** means "the day after", so picking Friday in the calendar with **Tomorrow** inserts Saturday. To insert exactly the day you picked, use a preset with an offset of 0.

## Why command hotkeys survive renames

Each preset has a fixed internal id that you never see. Commands are named after the preset but identified by that id, and Obsidian stores hotkeys by command id. Renaming a preset or changing its format updates the command's name and keeps its hotkey.
