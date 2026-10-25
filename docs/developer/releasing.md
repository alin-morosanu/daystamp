# Releasing

This page is for maintainers.

## Versioning

Daystamp follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html). The version lives in `manifest.json`, `package.json` and `versions.json`, and all three always match. The git tag is the bare version, such as `1.2.0`, **without a `v`**, because Obsidian requires that.

Semver protects what users rely on:
- command ids (hotkeys are bound to them)
- the shape of `data.json` and its migration path
- the default trigger and how it behaves
- what an unchanged preset inserts
- `minAppVersion` support

| Bump | When | Examples |
|---|---|---|
| **Major** | Breaks something users set up or rely on, with no automatic path. | Removing or renaming a command id; a settings change without a migration; changing what an existing preset inserts; dropping mobile support. |
| **Minor** | New backwards-compatible features, or raising `minAppVersion`. | A new transform, query syntax or setting; a settings change with a migration; `minAppVersion` 1.13 → 1.14. |
| **Patch** | Backwards-compatible fixes only. | Bug, accessibility or performance fixes. |

Raising `minAppVersion` is minor because Obsidian serves users on older versions the last compatible release, using `versions.json`.

Development runs at `0.y.z`, where anything may change. The first directory submission is `1.0.0`. Obsidian only accepts plain `x.y.z`, so there are no pre-release tags. **Never re-tag or reuse a version**; fix a broken release with a new patch.

## Changelog

`CHANGELOG.md` follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and is written by hand, for users.

- Newest first, with `## [Unreleased]` always at the top. Each release is `## [x.y.z] - YYYY-MM-DD`.
- Groups, in this order and only when non-empty: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Refactors, tests and CI changes aren't listed.
- Breaking changes start with **BREAKING:** and say what users need to do.
- Compare links at the bottom, without a `v`:
  ```
  [Unreleased]: https://github.com/alin-morosanu/daystamp/compare/1.0.0...HEAD
  [1.0.0]: https://github.com/alin-morosanu/daystamp/releases/tag/1.0.0
  ```

The release workflow copies the version's changelog section into the GitHub release, so the release page and Obsidian's update screen show the same text.

## Release procedure

1. Move the `Unreleased` entries into a new `## [x.y.z] - YYYY-MM-DD` section and update the compare links.
2. Run `npm version <major|minor|patch> --no-git-tag-version`. The `version` script runs `version-bump.mjs`, which updates `manifest.json` and `versions.json`.
3. Run `npm audit`, then commit as `chore(release): x.y.z`.
4. Run a preview scan of that commit in the Obsidian developer dashboard and fix anything it reports.
5. Tag and push:
   ```sh
   git tag x.y.z
   git push --follow-tags
   ```

The **Release** workflow then checks that the tag equals `manifest.json`'s version, that `versions.json` has the version and that the changelog has a section for it. It runs lint, tests, build and the size check, attests build provenance, and publishes `main.js`, `manifest.json` and `styles.css` as release assets. Release assets always come from CI, never from a local build.

## Community directory

Plugins are submitted and managed through the developer dashboard at [community.obsidian.md](https://community.obsidian.md). Every release is scanned automatically, and a release that fails is removed from search within 24 hours. That's why step 4 above matters.

Before the first submission, and whenever these change, check:

- `manifest.json`: `id` doesn't contain "obsidian" or end in "plugin"; `name` doesn't contain "Obsidian"; `description` doesn't contain "Obsidian", doesn't start with "This plugin" and ends with punctuation; no unknown or empty keys.
- `LICENSE` has the current copyright year and holder.
- The README states what the plugin accesses (network, files, clipboard).
- No default hotkeys, no telemetry, no obfuscated code.
