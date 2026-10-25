# Privacy and security

## What Daystamp accesses

| Capability | Use |
|---|---|
| Network | **None.** No requests, telemetry, analytics or remote configuration. |
| File system | Writes only its own settings file, `.obsidian/plugins/daystamp/data.json`. Edits your notes only when you insert a date. |
| Clipboard | **None.** |
| Other plugins | Reads the core Daily notes plugin's date format (for links) and checks whether Natural Language Dates is enabled (for the trigger warning). Both are read-only. |

## How it protects you

Your settings file lives inside your vault, so anyone who can change the vault can change it, for example through a shared vault, Git, Obsidian Sync, or a vault you downloaded. Daystamp treats that file as untrusted:

- **Settings are checked on load.** Wrong types fall back to defaults, text fields and the preset count are limited, offsets are capped, and preset ids must match a strict pattern.
- **Nothing from settings is treated as HTML.** Preset names and formats are always shown as plain text, so a preset called `<img src=x onerror=…>` can't run code.
- **The trigger is matched literally**, on at most 50 characters before the cursor, with a pattern that can't be made slow.
- **Links can't be broken out of.** `[`, `]` and `|` are removed from link targets.
- **No dynamic code.** Daystamp never evaluates text as code.

Daystamp has no runtime dependencies; date handling comes from the copy of moment.js built into Obsidian.

## Reporting a problem

See the [security policy](../../../SECURITY.md).
