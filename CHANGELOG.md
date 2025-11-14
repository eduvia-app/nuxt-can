# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/your-org/nuxt-can/releases/tag/v1.0.0
