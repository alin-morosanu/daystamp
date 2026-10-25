# Conventions

Lint and Prettier enforce most style. This page covers the rest, and explains the rules lint applies. Anything not covered here follows the existing code.

## Obsidian directory rules come first

Daystamp is meant for Obsidian's Community plugins directory, which scans every release automatically and removes a plugin from search if a release fails. ESLint uses the same rules as the scanner (`eslint-plugin-obsidianmd` recommended), so **lint must pass with 0 errors and 0 warnings**. Where a rule here conflicts with Obsidian's [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) or [developer policies](https://docs.obsidian.md/Community+directory/Developer+policies), theirs wins.

- Use `this.app`, never the global `app`.
- **Popout windows:** use `activeDocument`/`activeWindow` (or `el.doc`/`el.win`), `window.setTimeout`, and `el.instanceOf(T)` instead of `instanceof` for DOM nodes and events.
- **No inline styles** (`el.style.x = …`). Use CSS classes in `styles.css`, or `setCssProps()` for computed values.
- **Mobile:** no Node or Electron imports, no regex lookbehind, and use `Platform` rather than `navigator`.
- **Commands:** no default hotkeys; ids don't contain the plugin id; names don't contain the plugin name or the word "command"; editor commands use `editorCheckCallback`.
- **Settings tab:** built with `getSettingDefinitions()`; no top-level heading; headings don't contain "settings"; sentence case.
- **Workspace:** `workspace.activeEditor`, never `workspace.activeLeaf`.
- **Private APIs** only in `services/obsidian-internals.ts`, through a narrow typed shape, never `any`.

## Security

`data.json` lives in the vault, so treat it as untrusted.

- **No `innerHTML`, `outerHTML` or `insertAdjacentHTML`.** Build elements with `createEl`/`createDiv`/`setText` or the helpers in `ui/dom.ts`.
- **No `eval`, `new Function`, network requests or telemetry.** The plugin only writes its own settings.
- Validate everything read from settings in `sanitizeSettings`; validate again when writing from the settings tab.
- Escape user text before putting it in a regex, and keep patterns linear-time.

## TypeScript

- Strict mode, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride`.
- No `any`. No non-null `!` in `src/` (allowed in tests); narrow instead.
- Named exports only. The one default export is the plugin class in `main.ts`, because Obsidian requires it.
- `interface` for object shapes, `type` for unions. `readonly` and `ReadonlyArray` for data passed around.
- Outcomes are discriminated unions (`{ ok: true, … } | { ok: false, reason }`), not `null`.
- `import type` for type-only imports. Group imports: `obsidian`, then external packages, then internal modules (`core`, `services`, `ui`), separated by blank lines.
- **Core functions are pure:** no hidden `Date.now()` or `moment()`; pass `now` in.
- Keep functions small (about 30 lines) and prefer early returns.
- Always `await` a promise or mark it with `void`.

## Naming

- Files: `kebab-case.ts`, named after the one concept they hold.
- Types and classes: `PascalCase`. Functions and variables: `camelCase`; functions start with a verb (`resolveDate`). Booleans read as questions (`isEditable`).
- Module constants: `UPPER_SNAKE_CASE`, and no magic numbers inline.
- Command ids: `kebab-case`, stable forever once released. Preset ids match `/^[a-z0-9-]{1,32}$/`.
- CSS classes: `daystamp-` prefix, BEM style (`daystamp-calendar__cell--today`).

## UI, text and accessibility

- All user-facing text lives in `src/strings.ts`, in sentence case ("Insert date", not "Insert Date").
- Every interactive element has an accessible name. Icon-only buttons go through `iconButton(parent, icon, label)` in `ui/dom.ts`.
- Never rely on colour alone. Pair it with a ring, an icon, bold text or a label.
- CSS uses Obsidian's variables and `em`/`rem` sizes, with `forced-colors` and `prefers-reduced-motion` rules where relevant.
- Target WCAG 2.2 AA for anything the plugin draws.

## Comments

- Explain **why**, not what.
- Every exported `core/` function has a one-line JSDoc stating its contract, including edge behaviour.
- Every private-API use says what it reads and what happens when it's missing.

## Tests

- One test file per `core/` module, under `tests/core/`. Use `describe('<function>')` and `it('<does X> when <Y>')`.
- Fix `now` in every date test. Never depend on the real clock or the machine's locale.
- New core functions ship with tests in the same commit: the normal case, edge cases, and hostile input where settings are involved.

## Git

- [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), in the imperative mood, each small and focused.
- `main` always builds: every commit passes lint, tests and build.
- Add an entry under `Unreleased` in `CHANGELOG.md` for every user-visible change.

## Definition of done

1. `npm run lint && npm test && npm run build` pass.
2. New core logic has tests.
3. UI changes pass a keyboard-only check at least (see [Development setup: Manual checks](development.md#manual-checks)).
4. No new private API outside `obsidian-internals.ts`, and no new runtime dependency.
5. Docs and `CHANGELOG.md` are updated if behaviour changed.
6. New behaviour uses an [extension point](extending.md).
7. Changes to the trigger, render or insert path pass `npm run bench` and `npm run check-size`.
