# Security policy

## Supported versions

Security fixes go into the latest release. Please update before reporting.

## Reporting a vulnerability

Please **don't open a public issue**. Report it privately through GitHub instead:

1. Go to the repository's [Security tab](https://github.com/alin-morosanu/daystamp/security).
2. Click **Report a vulnerability** and describe the problem, how to reproduce it, and its impact.

You'll get a reply as soon as possible. Once a fix is released, the report can be made public, with credit to you if you like.

## Scope

Daystamp makes no network requests and only writes its own settings file. Its main risk is untrusted content in that settings file (`data.json`), which anyone who can change your vault can edit. See [Privacy and security](docs/user/explanation/privacy-and-security.md) for how the plugin handles it.
