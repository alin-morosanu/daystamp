# Troubleshooting

## "Open a note in editing mode to insert a date"

Daystamp can only insert into a note that's being edited. Switch the note to Source mode or Live Preview (**Ctrl/Cmd+E** toggles Reading view), click into it, and try again.

## Typing `@@` doesn't open the list

Check, in order:

1. **Enable inline trigger** is on, and **Trigger** is what you're typing (**Settings → Daystamp → Inline trigger**).
2. You're not inside a code block, inline code or the frontmatter. The trigger is ignored there on purpose.
3. You typed nothing but letters, digits, `+`, `-` or `_` after the trigger. A second space, or punctuation such as `.`, closes the list.
4. Your offset has at most 3 digits. `@@+1000` isn't an offset, so it's treated as filter text and matches no preset.

A code block you've just typed may take a moment to be recognised. Until then, the list can still open inside it.

## Two popups open after `@`

Natural Language Dates also uses `@`. [Change Daystamp's trigger](how-to/change-the-trigger.md) to one that doesn't start with `@`.

## "This preset has an empty format"

Open the preset in **Settings → Daystamp** and enter a format.

## The link points to the wrong note

Set **Link target format** to match your daily note names, including any folders, for example `YYYY/MM/YYYY-MM-DD`. See [Link dates to daily notes](how-to/link-dates-to-daily-notes.md).

## Tomorrow in the calendar doesn't insert the day I picked

That's intended: a preset's day offset also applies to calendar picks. Choose a preset with an offset of 0 to insert the picked day itself. See [How dates are worked out](explanation/how-dates-are-worked-out.md).

## A new built-in preset doesn't show up

Built-in presets are only added on a fresh install, so updates never overwrite your own list. To get them, use **Reset presets to defaults** (you can undo for 5 seconds), or add the preset yourself.

## Weekday names are in the wrong language

They follow Obsidian's language (**Settings → General → Language**). Restart Obsidian after changing it.

## Still stuck?

[Open an issue](https://github.com/alin-morosanu/daystamp/issues) with your Obsidian version, your platform, and the steps that cause the problem.
