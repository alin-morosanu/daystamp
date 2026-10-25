# Getting started

This tutorial installs Daystamp and inserts a date in each of its four ways. It takes about five minutes.

**You need:** Obsidian 1.13.0 or later, on desktop or mobile.

## 1. Install Daystamp

Daystamp isn't listed in Obsidian's Community plugins directory yet. Until it is, install it by hand:

1. Open the [latest release](https://github.com/alin-morosanu/daystamp/releases/latest) and download `main.js`, `manifest.json` and `styles.css`.
2. In your vault, create the folder `.obsidian/plugins/daystamp/` and put the three files in it.
3. In Obsidian, open **Settings → Community plugins**, turn off Restricted mode if it's on, and enable **Daystamp**.

Once Daystamp is in the directory, you'll be able to install it from **Settings → Community plugins → Browse** instead.

## 2. Insert today's date with the ribbon icon

1. Open any note and click where you want the date.
2. In the left ribbon, click the **calendar with a clock** icon.

Today's date appears at the cursor, for example `2026-10-25`. That's the **Date** preset, the default.

> [!tip]
> Hover over the icon to see which preset it inserts.

## 3. Use the inline trigger

1. In the note, type `@@`.

   A list of presets opens. Each row shows what it will insert, with the preset name and format underneath.
2. Press **Enter**.

   `@@` is replaced by today's date.
3. Type `@@+1`.

   The list now shows tomorrow's dates, with a header like `+1 day → Mon, 26 Oct`.
4. Use the arrow keys to choose **Date+Time** and press **Enter**.

## 4. Pick a day from the calendar

1. Open the command palette (**Ctrl/Cmd+P**) and run **Daystamp: Insert date from calendar**.
2. Press the arrow keys to move to another day, or click one.
3. Check the line under the grid: it shows exactly what will be inserted.
4. Press **Enter**, or click **Insert**.

The date goes where your cursor was before the calendar opened.

## 5. Run a preset command

Open the command palette and type `insert`. Every preset has its own command, named after the preset and its format, such as **Daystamp: Insert Date+Day (YYYY-MM-DD dddd)**. You can also give any of them a hotkey in **Settings → Hotkeys**.

## What you've learned

You've inserted dates with the ribbon icon, the `@@` trigger, the calendar and a command. All four use the same **presets**.

## Next steps

- [Create your own preset](how-to/create-a-preset.md) with your favourite format.
- [Link dates to your daily notes](how-to/link-dates-to-daily-notes.md).
- Browse the [format tokens](reference/format-tokens.md) you can use.
