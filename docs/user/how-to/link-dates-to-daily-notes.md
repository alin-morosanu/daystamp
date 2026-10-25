# Link dates to daily notes

Daystamp can insert a date as a link to that day's daily note while still showing your own format, for example `[[2026-10-25|Sunday 25 October, 14:30]]`.

## Turn it on for a preset

1. Open **Settings → Daystamp** and click the **pencil** button on a preset.
2. Turn on **Link to daily note**.

The preview now shows the link. When the link name and the formatted date are the same, Daystamp drops the alias and inserts just `[[2026-10-25]]`.

## Match your daily note names

The link points at a note named after the date. Daystamp works out that name in this order:

1. The **Link target format** setting, if you've filled it in.
2. Otherwise, the **Date format** of the core **Daily notes** plugin, if it's enabled.
3. Otherwise, `YYYY-MM-DD`.

If your daily notes live in dated folders, include the folders in the format. For example, `YYYY/MM/YYYY-MM-DD` links to `[[2026/10/2026-10-25]]`.

## If you see a warning

Obsidian treats `:` `\` `#` and `^` specially inside links. If your link target format produces one of them, Daystamp shows a warning in settings and in the preset editor. Change the format to avoid those characters, for example use `HH.mm` instead of `HH:mm` in note names.

Daystamp always removes `[`, `]` and `|` from link targets, so a format can never break the link.

## Related

- [Settings reference: Links](../reference/settings.md#links)
- [How dates are worked out](../explanation/how-dates-are-worked-out.md)
