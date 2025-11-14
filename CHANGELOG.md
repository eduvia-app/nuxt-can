# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-15
### Added
- Automatically mirror `v-can` guards across `v-else-if` / `v-else` branches and surface the inferred expression in documentation and fixtures.
- New `chains` playground fixture plus SSR tests that cover guard mirroring and explicit `v-cannot` fallbacks.

### Changed
- Enforce adjacency rules for implicit `v-cannot` blocks while allowing wrapped fallbacks when the permission expression is provided.
- Expand README guidance with explicit examples for guard mirroring, wrapped fallbacks, and known DX errors.

## [1.0.1] - 2025-11-14
### Changed
- Publish as the scoped package `@eduvia-app/nuxt-can` and document the scoped install steps.
- Fill out package metadata (author, repository, keywords, peer dependency) for npm.

### Docs
- Update README badges/links to the scoped npm package and explain why `v-can` helps existing codebases.

## [1.0.0] - 2025-11-14
### Added
- Compile-time transformer that rewrites `v-can` / `v-cannot` into optimized `v-if` guards.
- Global runtime plugin that injects the `can` proxy, `$can`, and the host-provided `__can__` checker.
- Permission-driven type generation with `types/nuxt-can.d.ts` and Nuxt schema augmentation.
- Playground showcasing multiple directive combinations, permission toggles, and a live summary.
- Test fixtures plus Vitest suite covering directive success paths and DX errors.
- MIT license.

### Docs
- English README describing usage, playground, and contribution guide.
- Roadmap and release prep guidance.

[1.1.0]: https://github.com/eduvia-app/nuxt-can/releases/tag/v1.1.0
[1.0.1]: https://github.com/eduvia-app/nuxt-can/releases/tag/v1.0.1
[1.0.0]: https://github.com/eduvia-app/nuxt-can/releases/tag/v1.0.0
