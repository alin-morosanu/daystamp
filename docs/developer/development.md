# Development setup

This page gets you from a fresh clone to a running, tested build.

## Prerequisites

- **Node.js** 22.12 or later, and npm.
- **Obsidian** 1.13.0 or later, with a vault you can use for testing. Don't use your real vault.

## Get the code

```sh
git clone https://github.com/alin-morosanu/daystamp.git
cd daystamp
npm ci
```

Use `npm ci`, not `npm install`, so you get exactly the versions in `package-lock.json`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Builds `main.js` and rebuilds on every change. |
| `npm run build` | Type-checks, then builds a minified `main.js`. |
| `npm test` | Runs the unit tests once. `npm run test:watch` keeps them running. |
| `npm run bench` | Runs the hot-path timing budgets (see [Architecture: Performance](architecture.md#performance)). |
| `npm run lint` | ESLint (0 errors and 0 warnings allowed) and a Prettier check. |
| `npm run format` | Rewrites files with Prettier. |
| `npm run check-size` | Fails if `main.js` is over its size budget. Run after `build`. |

CI runs `npm ci`, `lint`, `test`, `build` and `check-size` on every push and pull request.

## Run it in Obsidian

Link the build output into a test vault, so every rebuild is picked up:

```sh
VAULT=/path/to/test-vault
mkdir -p "$VAULT/.obsidian/plugins/daystamp"
for f in main.js manifest.json styles.css; do
  ln -sf "$PWD/$f" "$VAULT/.obsidian/plugins/daystamp/$f"
done
npm run dev
```

On Windows, copy the three files instead, or use `mklink`.

In Obsidian, enable **Daystamp** under **Settings → Community plugins**. After a rebuild, reload the plugin by turning it off and on, or install the [Hot-Reload](https://github.com/pjeby/hot-reload) plugin.

To try the mobile layout on desktop, open the developer console (**Ctrl/Cmd+Shift+I**) and run `app.emulateMobile(true)`. Run `app.emulateMobile(false)` to switch back.

## Tests

Tests live in `tests/` and mirror `src/`:

- `tests/core/` covers the pure logic in `src/core/`. These tests use moment directly and need no Obsidian stub.
- `tests/services/` covers the services with small fakes: `FakeEditor` (an editor over a plain string) and an in-memory save function. Here the `obsidian` import is replaced by `tests/obsidian-stub.ts`.
- `tests/**/*.bench.ts` are timing budgets, run only by `npm run bench`.

Tests always run in the `Europe/Bucharest` time zone (so daylight-saving cases are real) with moment's locale set to English. Never depend on the real clock: pass a fixed `now`, such as `moment('2026-10-25T14:30:00')`.

The UI (calendar, suggester, settings) has no automated tests, so check it by hand in Obsidian. Keep logic out of UI classes so there's little left to test that way. For example, calendar key handling is the pure `moveFocus()` in `src/core/calendar-grid.ts`.

## Manual checks

Before opening a pull request that touches behaviour or UI, check the relevant items in Obsidian:

- **Ribbon:** a click inserts the default preset; a selection is replaced; in Reading view you get a notice and nothing changes.
- **Commands:** preset commands work from the palette, from `/` (core Slash commands on) and from a hotkey. Renaming a preset keeps its hotkey; a new preset gets a command without reloading.
- **Trigger:** `@@` shows presets, `@@+3` previews three days ahead, `@@time` filters. Nothing opens inside a code block. **Pick from calendar…** replaces the trigger; cancelling removes it.
- **Calendar:** mouse and keyboard-only navigation both work; the chosen preset is applied; the insert lands at the original cursor.
- **Links:** with **Link to daily note**, Date+Time inserts `[[2026-10-25|2026-10-25 14:30]]` and the link resolves.
- **Mobile:** with `app.emulateMobile(true)`, the ribbon, commands and trigger work.
- **Accessibility:** keyboard-only pass through calendar and settings; a screen reader announces month changes and day names; forced colours (Windows High Contrast) and 200% zoom still work.
- **Efficiency:** `data.json` doesn't change on every keystroke in settings or on every insert; typing fast in a long note with the trigger on doesn't lag.

## Next

- [Architecture](architecture.md) explains how the code fits together.
- [Conventions](conventions.md) lists the rules lint can't check.
