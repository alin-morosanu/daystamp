# Contributing to Daystamp

Thanks for helping. Bug reports, fixes, documentation and ideas are all welcome.

## Report a bug or ask for a feature

[Open an issue](https://github.com/alin-morosanu/daystamp/issues). For bugs, include:

- your Obsidian version and platform (Windows, macOS, Linux, iOS, Android)
- the steps that cause the problem, what you expected, and what happened
- any errors from the developer console (**Ctrl/Cmd+Shift+I**), if you can

Search existing issues first. To report a security problem, follow the [security policy](SECURITY.md) instead of opening a public issue.

## Contribute code or docs

1. For anything larger than a small fix, open an issue first so we can agree on the approach.
2. Fork the repository and create a branch from `main`.
3. Set up and run the plugin: see [Development setup](docs/developer/development.md).
4. Make your change, following the [conventions](docs/developer/conventions.md). New behaviour should use one of the [extension points](docs/developer/extending.md).
5. Make sure `npm run lint`, `npm test` and `npm run build` pass.
6. Update the docs in `docs/`, and add an entry under `Unreleased` in [CHANGELOG.md](CHANGELOG.md) if users will notice the change.
7. Open a pull request that explains what changed and why, and how you tested it.

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, for example `fix: keep cursor after inserted link`.

## Documentation

User and developer docs live in [`docs/`](docs/README.md). User docs are grouped by purpose: a getting-started tutorial, how-to guides, reference and explanation. Write in plain, direct language, use the exact labels shown in Obsidian in **bold**, and check that every example is true.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
