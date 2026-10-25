# Format tokens

Daystamp formats use [moment.js tokens](https://momentjs.com/docs/#/displaying/format/), the same as Obsidian's core Daily notes and Templates plugins. Examples below are for Sunday 25 October 2026 at 14:30:05.

## Common tokens

| Token | Output | Meaning |
|---|---|---|
| `YYYY` | 2026 | Year |
| `YY` | 26 | Two-digit year |
| `MMMM` | October | Month name |
| `MMM` | Oct | Short month name |
| `MM` | 10 | Month, two digits |
| `M` | 10 | Month |
| `DD` | 25 | Day of month, two digits |
| `D` | 25 | Day of month |
| `Do` | 25th | Day of month with ordinal |
| `dddd` | Sunday | Weekday name |
| `ddd` | Sun | Short weekday name |
| `HH` | 14 | Hour, 24-hour clock |
| `hh` | 02 | Hour, 12-hour clock |
| `mm` | 30 | Minutes |
| `ss` | 05 | Seconds |
| `A` | PM | AM or PM |
| `WW` | 43 | ISO week number |
| `GGGG` | 2026 | ISO week year (use with `WW`) |
| `Q` | 4 | Quarter |
| `L` | 10/25/2026 | Date in your language's style |
| `LL` | October 25, 2026 | Long date in your language's style |
| `LT` | 2:30 PM | Time in your language's style |

## Literal text

Put text in square brackets to insert it unchanged: `[Week] WW` gives `Week 43`, and `[at] HH:mm` gives `at 14:30`.

## Ready-made formats

| Format | Output |
|---|---|
| `YYYY-MM-DD` | 2026-10-25 |
| `DD.MM.YYYY` | 25.10.2026 |
| `MM/DD/YYYY` | 10/25/2026 |
| `dddd, D MMMM YYYY` | Sunday, 25 October 2026 |
| `YYYY-MM-DD HH:mm` | 2026-10-25 14:30 |
| `GGGG-[W]WW` | 2026-W43 |
| `HH:mm` | 14:30 |

## Language

Month and weekday names, and the `L`/`LL`/`LT` styles, follow Obsidian's language setting. With Obsidian set to Romanian, `dddd` gives `duminică`.
