# Architecture

This page explains how the code is organised and why. For the rules you follow when changing it, see [Conventions](conventions.md).

## Layers

```
ui/        Obsidian components and DOM   (Modal, EditorSuggest, SettingTab)
  │ uses
services/  Obsidian-aware, no DOM        (settings store, insert pipeline, commands, internals)
  │ uses
core/      pure TypeScript               (dates, formatting, query parsing, grid, settings schema)
```

- **Imports only point downward.** `core/` imports nothing from `obsidian`, the DOM or other layers; the one exception is `import type { Moment } from 'moment'`. `services/` never touches the DOM. `ui/` never saves settings or reads private APIs directly. ESLint enforces this per folder (`no-restricted-imports` in `eslint.config.mjs`).
- **`features/` sits beside `ui/`.** Each feature wires services to UI for one entry point, and may import both.
- **`main.ts` is the composition root.** It builds the services, then calls `register(ctx)` on every entry in `FEATURES`. It holds no logic, and nothing imports the plugin class.

Keeping `core/` pure means most behaviour is tested without Obsidian.

## Folder layout

```
src/
  main.ts                 composition root (default export, required by Obsidian)
  strings.ts              every user-facing string
  core/
    types.ts              Preset, Settings, InsertResult, CalendarCell
    settings-schema.ts    defaults, sanitizeSettings, MIGRATIONS
    presets.ts            immutable preset operations (add, remove, move, update, reset)
    date.ts               resolveDate, atTimeOfDay
    query.ts              trigger matching, QUERY_PARSERS, filterPresets
    format.ts             render, TRANSFORMS, link-target helpers
    calendar-grid.ts      buildMonthGrid, moveFocus
    commands-diff.ts      diffCommands
  services/
    settings-store.ts     owns Settings: update, onChange, debounced save, flush
    insert-service.ts     the insert pipeline, preview, editability checks
    usage-tracker.ts      in-memory usage counters, saved rarely
    command-registry.ts   applies diffCommands with addCommand/removeCommand
    obsidian-internals.ts the only private-API access
  features/
    feature.ts            Feature, FeatureContext
    index.ts              FEATURES registry
    ribbon.ts, commands.ts, editor-menu.ts, inline-trigger.ts, calendar.ts, settings.ts
  ui/
    dom.ts                safe element and ARIA helpers
    date-suggest.ts       EditorSuggest for the inline trigger
    calendar-modal.ts     calendar modal
    preset-modal.ts       editor for one preset
    settings-tab.ts       settings tab (getSettingDefinitions)
```

## The insert pipeline

Every entry point builds an `InsertRequest` and calls `InsertService.insert()`:

```ts
interface InsertRequest {
  presetId: string;
  date?: Moment;        // calendar pick; otherwise "now"
  extraOffset?: number; // from @@+3
  range?: EditorRange;  // trigger text to replace; otherwise the selection
  editor?: Editor;      // captured editor; otherwise the active editable one
}
```

1. **Resolve the editor:** the one in the request, or the active editor if it's in Source mode or Live Preview. Otherwise, show a notice and stop.
2. **Find the preset.** Unknown ids fall back to the default preset.
3. **Resolve the date:** start from `now`, or from the picked day at the current time. Add the preset's offset plus `extraOffset` as whole calendar days.
4. **Render:** format, then apply the preset's transforms. `render()` returns `InsertResult`, either `{ ok: true, text }` or `{ ok: false, reason }`.
5. **On failure,** show the notice for `reason` and stop.
6. **Write:** one editor transaction replaces the range or selection, then the cursor moves after the text.
7. **Record usage.**

`InsertService.preview()` runs steps 2 to 4 without an editor; suggester rows, the calendar preview and the settings previews use it. Because every path goes through one pipeline, behaviour is identical everywhere, and future multi-cursor support only changes step 6.

## State and events

- `SettingsStore` is the only owner of `Settings`. Readers call `store.get()` and get an immutable snapshot. Writers call `store.update(s => next)`, usually with a `core/presets.ts` helper.
- `update()` notifies `onChange(prev, next)` listeners right away and saves after 500 ms. `flush()` saves immediately; it runs when the settings tab closes and when the plugin unloads.
- `replace()` swaps in settings that are already saved, such as changes from Obsidian Sync (`onExternalSettingsChange`). It notifies without saving.
- Subscribers: the command registry, the ribbon tooltip, the calendar ribbon visibility and the settings tab. The suggester and calendar read `store.get()` when they open.
- Listeners are removed on unload through `plugin.register(unsubscribe)`.

## Lifecycle

- Everything is registered through `register*`, `addCommand` and `addRibbonIcon`, so Obsidian cleans it up on unload.
- `onload` only loads settings and wires things up. No date work or DOM reads happen until first use.
- On unload, pending usage counts are folded into settings and a pending save is flushed.

## Error handling

- **Expected failures are values.** Empty format, invalid date and no editor come back as `InsertResult` and become a notice.
- **Unexpected exceptions are bugs.** `InsertService.insert()` catches them at the boundary, logs `console.error('[daystamp]', err)` and shows a generic notice. Core code never catches.
- **Private APIs live in `services/obsidian-internals.ts` only.** Each function returns a fallback instead of throwing, and none is called on the keystroke path. Today there are two: the Daily notes date format, and whether a community plugin is enabled.

## Performance

| Path | Budget | How |
|---|---|---|
| `onload` | < 5 ms | Wiring only. The modals, suggester rows and settings DOM are created on first use. |
| Trigger check, no match (every keystroke) | < 0.05 ms | Backward scan over at most 50 characters; no regex, moment or allocation before a match. |
| Trigger match plus suggestions | < 2 ms | Regex compiled once per trigger change; code check uses the cached metadata; at most 50 presets. |
| Insert | < 1 ms | One `resolveDate`, one `render`, one transaction. |
| Calendar month change | < 4 ms | Rebuilds 42 cells; moving focus within a month doesn't rebuild. |
| `main.js` (minified) | < 40 KB | No runtime dependencies; moment and CodeMirror come from Obsidian. |

`npm run bench` checks the middle four; `npm run check-size` checks the bundle.

Rules that keep it fast:
- **Precompute on change, not on use.** The store derives the trigger regex, presets by id and the default preset whenever settings change.
- **Cheap checks first.** The trigger check goes string, then regex, then metadata, and stops at the first that fails.
- **No polling.** The only timers are the save and usage delays (`window.setTimeout`). No intervals, observers or vault listeners.
- **At most one settings write per user action.** Never on a keystroke or an insert.
- **Minimal DOM work.** The settings tab redraws only on structural preset changes; inputs update just their own preview.
