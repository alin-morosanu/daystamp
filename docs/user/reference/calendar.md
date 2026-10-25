# Calendar

Open the calendar with the **Insert date from calendar** command, the calendar ribbon icon, the editor context menu, or **Pick from calendar…** in the `@@` list.

It opens on today. The day you're on is the selected day; it's filled in. Today has a ring and bold text.

## Parts

| Part | What it does |
|---|---|
| **‹ ›** | Previous and next month. |
| Month title | Click to show **Month** and **Year** fields for jumping far ahead or back. |
| **Today** | Go back to today. |
| Grid | Days of the month, plus days from the neighbouring months. |
| **Preset** | The preset to insert. Starts with the last one you used since opening Obsidian, otherwise the default. |
| Preview | Exactly what will be inserted. |
| **Insert** | Insert the selected day and close. |

## How the date is built

- The **day** is the one you pick.
- The **time** is the current time, for presets that show a time. A hint says so.
- The preset's **day offset** is added to the picked day: **Tomorrow** on a picked Friday inserts Saturday.

## Keyboard

Keys work while the grid has focus.

| Key | Action |
|---|---|
| **← →** | Previous or next day (swapped in right-to-left languages) |
| **↑ ↓** | Same day in the previous or next week |
| **Home / End** | Start or end of the week |
| **Page Up / Page Down** | Previous or next month |
| **Shift+Page Up / Shift+Page Down** | Previous or next year |
| **T** | Today |
| **Enter** or **Space** | Insert the selected day |
| **Esc** | Close without inserting |

Moving to a day in another month switches the grid to that month. Moving by month from the 31st lands on the month's last day.

## Mouse and touch

- Click or tap a day to select it.
- Double-click or double-tap a day to insert it straight away.

## Settings

- **First day of the week:** follows your Obsidian language by default; you can choose Sunday or Monday instead.
- **Show calendar ribbon icon:** adds a ribbon icon that opens the calendar.

After you insert, the cursor returns to where it was in the note when the calendar opened.
