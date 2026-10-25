# Extending Daystamp

New behaviour plugs into one of four **extension points**. Each is a small interface plus an ordered, read-only array in one file. Adding to it should mean adding one object and one line, never adding branches to the insert pipeline.

If your change fits none of them, open an issue to discuss a new extension point before writing code.

| To add… | Extend | File |
|---|---|---|
| An entry point (a new way to insert) | `FEATURES` | `src/features/index.ts` |
| Syntax after the trigger | `QUERY_PARSERS` | `src/core/query.ts` |
| Post-processing of the output | `TRANSFORMS` | `src/core/format.ts` |
| A change to the settings shape | `MIGRATIONS` | `src/core/settings-schema.ts` |

Ids are stable: they end up in settings and command ids, so never rename one after release.

## Add an entry point

A feature receives a `FeatureContext` (`plugin`, `store`, `insert`, `env`, `session`, `now`, `getActiveEditor`, `notify`) and registers whatever it needs. Always insert through `ctx.insert`.

```ts
// src/features/status-bar.ts
import type { Feature } from './feature';

export const statusBarFeature: Feature = {
  id: 'status-bar',
  register(ctx) {
    const el = ctx.plugin.addStatusBarItem();
    el.setText('Insert date');
    el.addEventListener('click', () => {
      ctx.insert.insert({ presetId: ctx.store.getDerived().defaultPreset.id });
    });
  }
};
```

Then add `statusBarFeature` to `FEATURES`. Put the text in `src/strings.ts`, not in the feature.

## Add query syntax

A `QueryParser` turns the text typed after the trigger into an offset, the rest of the text for filtering, and an optional label. Parsers are tried in order; the first that returns a match wins. The last one, `filterOnlyParser`, accepts anything.

```ts
export const weeksParser: QueryParser = {
  id: 'weeks',
  parse(query) {
    const match = /^([+-]?)(\d{1,2})w\s*(.*)$/su.exec(query); // @@+2w
    if (!match) return null;
    const days = Number(match[2]) * 7 * (match[1] === '-' ? -1 : 1);
    return { offsetDays: days, filter: (match[3] ?? '').trim(), label: { kind: 'offset', days } };
  }
};

export const QUERY_PARSERS = [weeksParser, offsetParser, filterOnlyParser];
```

Parsers live in `core/`, so they must be pure, and tested in `tests/core/query.test.ts`. A natural-language parser returns the whole-day difference between `now` and the date it understood. Keep patterns linear-time (no nested quantifiers) and avoid regex lookbehind, which some iOS versions don't support.

The trigger pattern in `buildTriggerPattern()` decides which characters can follow the trigger at all. Widen it if your syntax needs more.

## Add an output transform

A transform rewrites the formatted text. Presets list the transform ids they use, and transforms run in `TRANSFORMS` order.

```ts
export const boldTransform: OutputTransform = {
  id: 'bold',
  apply: (text) => `**${text}**`
};

export const TRANSFORMS = [wikiLinkTransform, boldTransform];
```

`sanitizeSettings` only keeps ids it finds in `TRANSFORMS`, so saved settings stay valid. To let users turn it on, add a control to `src/ui/preset-modal.ts` that calls `deps.setTransform('bold', enabled)`.

## Change the settings shape

1. Change `Settings` in `src/core/types.ts`, and the defaults and checks in `src/core/settings-schema.ts`.
2. Raise `SETTINGS_VERSION`.
3. Add a migration keyed by the version it upgrades **from**:

   ```ts
   export const MIGRATIONS = {
     0: (raw) => ({ /* existing */ }),
     1: (raw) => ({ ...raw, settingsVersion: 2, newField: raw.oldField ?? 'default' })
   };
   ```
4. Add tests showing old settings load into the new shape.

Migrations run before validation, from the stored version up to the current one, so users' existing settings keep working. A settings change with a migration is a minor release; without one, it's a breaking change (see [Releasing](releasing.md)).

## Checklist

- [ ] It plugs into an extension point, with no new branch in the pipeline.
- [ ] New `core/` code has tests: the normal case, edge cases, and hostile input if it reads settings.
- [ ] New strings are in `src/strings.ts`, in sentence case.
- [ ] Docs in `docs/` and the `Unreleased` section of `CHANGELOG.md` are updated.
- [ ] If it touches the trigger, render or insert path, `npm run bench` still passes.
