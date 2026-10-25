# Commands, ribbon and context menu

## Commands

Commands appear in the command palette and in the core **Slash commands** plugin, prefixed with **Daystamp:**. None has a default hotkey; assign your own in **Settings → Hotkeys**.

| Command | What it does |
|---|---|
| **Insert default date** | Inserts the default preset at the cursor. |
| **Insert date from calendar** | Opens the [calendar](calendar.md). |
| **Insert {name} ({format})** | One per preset. Inserts that preset. Example: **Insert Tomorrow (YYYY-MM-DD)**. |

Commands only appear while a note is open in editing mode (Source mode or Live Preview).

Preset commands are added, renamed and removed as you change presets, without restarting Obsidian. Each is tied to the preset's internal id, so **a hotkey keeps working after you rename the preset or change its format**.

## Ribbon icons

| Icon | Click to | Notes |
|---|---|---|
| Calendar with a clock | Insert the default preset | The tooltip names the preset, for example **Insert Date (YYYY-MM-DD)**, and updates when you change the default. |
| Calendar | Open the calendar | Hidden unless **Show calendar ribbon icon** is on. |

## Editor context menu

Right-click (long-press on mobile) in a note being edited:

- **Insert date** inserts the default preset.
- **Insert date from calendar…** opens the calendar.

## What every insert does

- Inserts at the cursor, or **replaces the selected text**.
- Leaves the cursor after the inserted text.
- Is a single undo step.
- Uses the date and time at the moment you insert.
- Adds a space afterwards if **Add space after insert** is on (it won't double a space that's already there).
- Shows a notice and changes nothing if no note is open in editing mode, or if the preset's format is empty.
