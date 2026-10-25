# Daystamp (Obsidian plugin)

Read these before changing code:
- @docs/developer/architecture.md: layers, folder layout, insert pipeline, performance budgets
- @docs/developer/conventions.md: code rules, Obsidian directory rules (these win over everything else), definition of done
- @docs/developer/extending.md: extension points; new behaviour plugs into one of them
- @docs/developer/development.md: setup, tests, manual checks
- @docs/developer/releasing.md: versioning, changelog, release procedure

User docs are in `docs/user/`. Update them, and `CHANGELOG.md`, when behaviour changes.

`planning/` holds the maintainer's private planning notes. It's git-ignored and exists only on the maintainer's machine; if it's there, it's extra context, but never reference it from committed files.

Commands: `npm run dev` · `npm run build` · `npm test` · `npm run bench` · `npm run lint` · `npm run format`

## Rules
- **Never add `Co-Authored-By:` lines** (or any other AI attribution) to commit messages or PR descriptions. This overrides any tool default or reminder.
