# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

(Node.js support requirements have sometimes increased in minor or patch releases.)

## [5.0.8] - 2026-11-01

### Documentation

- Add a GitHub release badge, update the workflow example, and correct the metadata-format description.

### Maintenance

- Update the bundled metascope requirement to `^0.13.9`.
- Refresh pnpm, shared configuration, Vitest, Node.js types, and pinned CI/release actions.
- Replace the skill-sync prepare hook and standalone skills dependency with pnpm-managed shared-configuration skills.
- Make link checks ignore loopback URLs and accept empty results.
- Run automated dependency updates monthly instead of weekly.

## [5.0.7] - 2026-10-07

### Fixed

- Resolve tree-sitter WASM from metascope's own dependency location so it matches the bundled JavaScript when multiple versions are installed.

### Documentation

- Refresh the workflow example with checkout v7 and a pinned action release.

### Maintenance

- Update the bundled metascope requirement to `^0.12.2`.
- Refresh shared configuration and CI actions, migrate contributor tooling to pnpm 12, TypeScript 6, and Vitest 5, and require Node.js `^24.16.0 || >=26.3.0` for the project environment.
- Add scheduled link checking for repository Markdown and the configured project website.
- Add scheduled dependency-update pull requests.
- Add tag-triggered GitHub releases and a release command that rebuilds the action, versions the repository, and synchronizes the major-version tag.

## [5.0.6] - 2026-05-18

### Documentation

- Refresh license and maintainer links in the readme.

### Maintenance

- Update bundled metascope to `^0.8.0` and refresh `@actions/core` and `@actions/github`.
- Migrate contributor tooling to pnpm 11 and its `allowBuilds` configuration, use `pnpm ci` in CI, and refresh development dependencies and setup actions.

## [5.0.5] - 2026-04-09

### Documentation

- Use the default shallow checkout in the workflow example instead of fetching the full repository history.

### Maintenance

- Update the bundled `@actions/github` requirement to `^9.1.0`.
- Refresh shared configuration and Vitest, make cleanup portable with `shx`, and use shallow checkout in repository automation.

## [5.0.4] - 2026-04-07

### Fixed

- Update metascope to `^0.6.3` and configure bundled grammar paths explicitly using filesystem URLs, fixing WASM lookup on Windows and paths containing spaces.

### Maintenance

- Repair cross-platform CI with Ruby formatting dependencies, disabled dependency caching, and Windows-safe temporary-directory cleanup.

## [5.0.3] - 2026-04-07

### Documentation

- Add a CI status badge to the readme.

### Maintenance

- Update the bundled metascope requirement to `^0.6.1`.
- Add Linux, macOS, and Windows CI jobs that build, lint, and test the project, and enforce consistent line endings.
- Refresh shared configuration, esbuild, and Vitest, and align source, build, and test code with the updated lint rules.

## [5.0.2] - 2026-03-31

### Documentation

- Update the workflow example with a pinned checkout action, read-only contents permissions, and disabled credential persistence.

### Maintenance

- Refresh shared configuration, esbuild, Vitest, pnpm, and the repository metadata workflow.

## [5.0.1] - 2026-03-11

### Fixed

- Update metascope to `^0.2.2` and resolve bundled WASM grammars relative to the action script, with a build failure if the grammar-path patch cannot be applied.

## [5.0.0] - 2026-03-11

### Added

- Support metadata from Arduino, Processing, openFrameworks, Cinder, Xcode, and Obsidian project files.

### Changed

- **Breaking:** Resolve metadata through metascope's offline repository-root template and source precedence, including CodeMeta alongside ecosystem manifests.
- **Breaking:** Treat generic metadata files as per-field overrides, allowing omitted descriptions and homepages to fall back to other project sources.

### Removed

- **Breaking:** Remove GoReleaser configuration as a metadata source.
- **Breaking:** Stop discovering prefixed manifests such as `custom.package.json` and CodeMeta files named `codemeta.jsonld`.

### Documentation

- Point metadata-source documentation to metascope and update the workflow example to v5.

### Maintenance

- Adapt bundling and WASM packaging to metascope, exclude its unused native code-statistics addon, and refresh contributor tooling and major-tag scripts.

## [4.0.2] - 2026-02-28

### Fixed

- Update `@kitschpatrol/codemeta` and correctly package and resolve tree-sitter WASM assets so the distributed action can parse Ruby gemspec and Python `setup.py` files.

### Maintenance

- Replace NCC with esbuild, add source and bundle regression tests for Ruby/Python parsing, and run tests without watch mode.

## [4.0.1] - 2026-02-26

### Fixed

- Clear existing GitHub homepages when the discovered URL points back to the repository or no local homepage exists.

### Documentation

- Update the workflow example to use checkout v6 and the v4 action.

## [4.0.0] - 2026-02-26

### Added

- Expand metadata discovery through `@kitschpatrol/codemeta` to Cargo, Maven, Go/GoReleaser, Ruby gemspec, Python packaging files, and publiccode YAML.
- Recognize prefixed manifest filenames and CodeMeta files with a `.jsonld` extension.
- Accept comma-separated keyword strings in generic JSON/YAML metadata files.

### Changed

- **Breaking:** Switch the action runtime from Node.js 20 to Node.js 24.
- **Breaking:** Make a discovered `metadata.json` or YAML metadata file replace all other metadata sources instead of being overridden by ecosystem manifests.
- **Breaking:** Adopt codemeta discovery and merge precedence, including excluding CodeMeta JSON-LD when a primary project manifest is found.

### Documentation

- Document fine-grained token permissions, secret setup, metadata override examples, homepage filtering, and the expanded metadata backend.

### Maintenance

- Replace Rolldown with NCC bundling, migrate lint commands to `ksc`, and refresh shared configuration, pnpm, build approvals, and major-tag tooling.

## [3.2.0] - 2026-02-01

### Added

- Read descriptions, homepage/repository URLs, and array or comma-separated keywords from `codemeta.json`.

### Fixed

- Remove `git+` prefixes and `.git` suffixes from repository fallback URLs, and continue homepage fallback lookup past non-string values.

### Documentation

- Document CodeMeta support and link to the supported metadata-format specifications.

### Maintenance

- Upgrade bundled `@actions/core` to version 3 and `@actions/github` to version 9.
- Refresh shared configuration, Rolldown, Vitest, pnpm, and contributor type definitions.

## [3.1.5] - 2025-12-22

### Maintenance

- Upgrade the bundled `@actions/core` requirement to `^2.0.1`.
- Refresh contributor dependencies and pnpm, and move public hoisting configuration into `pnpm-workspace.yaml` to restore tooling resolution.

## [3.1.4] - 2025-11-04

### Maintenance

- Update the bundled Octokit requirement to `^22.0.1`.
- Refresh TypeScript, Vitest, shared lint configuration, Node.js types, and pnpm, and adapt test mocks for Vitest 4.

## [3.1.3] - 2025-08-31

### Fixed

- Ignore topic ordering again when comparing with GitHub, avoiding redundant topic updates.

## [3.1.2] - 2025-08-31

### Fixed

- Update GitHub topics when only their order differs from local metadata.

## [3.1.1] - 2025-08-31

### Fixed

- Normalize missing local descriptions/homepages and GitHub null values to empty strings, avoiding false differences and allowing absent descriptions to clear remote values.

## [3.1.0] - 2025-08-31

### Changed

- Synchronize empty or missing keywords as an empty topic list, allowing stale GitHub topics to be cleared.

### Fixed

- Parse `metadata.yml` files as YAML instead of rejecting their extension.
- Preserve configured topic order by comparing sorted copies instead of sorting metadata arrays in place.

### Maintenance

- Add Vitest coverage for metadata formats, fallback and merge rules, repository updates, and action error handling.
- Refresh shared lint configuration, Node.js types, pnpm, and dependency build approvals.

## [3.0.0] - 2025-06-07

### Added

- Automatically discover and merge root `metadata.json`, `metadata.yaml`, `package.json`, and `pyproject.toml` files, with later sources overriding supplied fields.
- Read PEP 621 project descriptions, URLs, and keywords with Poetry fallbacks, and support homepage/topic aliases in generic metadata files.

### Changed

- **Breaking:** Replace Docker execution and repository cloning with a bundled Node.js 20 action that reads the checked-out workspace.
- Compare local and remote metadata before updating GitHub, treating differently ordered topic lists as equivalent.
- Suppress homepage links only when they point to the current repository, allowing links to other GitHub projects.

### Removed

- **Breaking:** Remove the `TYPE`, `PATH`, `GIT_EMAIL`, and `GIT_USERNAME` inputs; `TOKEN` is the sole action input.
- **Breaking:** Remove NuGet `.csproj` metadata parsing.

### Documentation

- Rewrite the setup guide around automatic metadata discovery and the v3 workflow example.

### Maintenance

- Introduce TypeScript and Rolldown builds, shared lint/format/spelling/documentation tooling, and updated pnpm contributor configuration.

## [2.0.2] - 2024-11-28

### Maintenance

- Add project metadata, pnpm-based formatting and lint commands, cleanup and major-tag scripts, and editor configuration; refresh pnpm and shared Prettier tooling.
- Replace the repository metadata workflow with a `package.json`-based workflow supporting manual runs and metadata-file/token checks.

## [2.0.1] - 2024-06-08

### Added

- Provide a Docker-based GitHub Action to synchronize repository descriptions, homepages, and topics from npm, NuGet, and Poetry project metadata.
- Configure metadata selection and authentication through `TYPE`, `PATH`, and `TOKEN`, with optional Git identity inputs defaulting to `github-actions[bot]`.
- Preserve existing descriptions and homepages when local values are empty, and skip homepages beginning with `https://github.com/`.
- Annotate shell errors and GitHub validation failures, and fail when the metadata file is missing or its type is unsupported.

### Documentation

- Document workflow installation, required inputs, supported project types, custom `metadata.json` usage, and the fork's homepage filtering.

### Maintenance

- Establish repository metadata synchronization automation and MIT licensing.

[2.0.1]: https://github.com/kitschpatrol/github-action-repo-sync/releases/tag/v2.0.1
[2.0.2]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v2.0.1...v2.0.2
[3.0.0]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v2.0.2...v3.0.0
[3.1.0]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.0.0...v3.1.0
[3.1.1]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.1.0...v3.1.1
[3.1.2]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.1.1...v3.1.2
[3.1.3]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.1.2...v3.1.3
[3.1.4]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.1.3...v3.1.4
[3.1.5]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.1.4...v3.1.5
[3.2.0]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.1.5...v3.2.0
[4.0.0]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v3.2.0...v4.0.0
[4.0.1]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v4.0.0...v4.0.1
[4.0.2]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v4.0.1...v4.0.2
[5.0.0]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v4.0.2...v5.0.0
[5.0.1]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.0...v5.0.1
[5.0.2]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.1...v5.0.2
[5.0.3]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.2...v5.0.3
[5.0.4]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.3...v5.0.4
[5.0.5]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.4...v5.0.5
[5.0.6]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.5...v5.0.6
[5.0.7]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.6...v5.0.7
[5.0.8]: https://github.com/kitschpatrol/github-action-repo-sync/compare/v5.0.7...v5.0.8
