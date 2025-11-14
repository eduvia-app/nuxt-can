# nuxt-can

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

`nuxt-can` ships two Vue directives (`v-can`, `v-cannot`) so you can encode permissions directly in Nuxt templates. Each directive is transformed at build time into a composable `__can__` call provided by your app, keeping the runtime lean, tree-shake friendly, and fully typed.

- [✨ Release Notes](/CHANGELOG.md)

## Highlights

- ✅ Cleanly adds permissions to existing templates without rewriting your business `v-if`s
- ✅ Compile-time transform of `v-can` / `v-cannot` into `v-if` guards
- ✅ Smart merge with existing `v-if` conditions (no extra wrappers)
- ✅ Auto-generated `can` proxy with types derived from your permissions map
- ✅ Pluggable import of the host `__can__` function (stores, APIs, etc.)
- ✅ Helpful DX errors for unsupported directive shapes

## Quick Start

Install the module in your Nuxt app:

```bash
npm install nuxt-can
# or
npx nuxi module add nuxt-can
```

Enable it inside `nuxt.config.ts` and describe the permissions tree:

```ts
// nuxt.config.ts
import NuxtCan from 'nuxt-can'

export default defineNuxtConfig({
  modules: [NuxtCan],
  nuxtCan: {
    permissions: {
      employee: ['view', 'edit'],
      contract: ['create'],
    },
    canFunctionImport: '~/permissions/can', // path to your __can__ implementation
  },
})
```

Provide the `__can__` implementation referenced above:

```ts
// permissions/can.ts
const permissionsStore = usePermissionsStore()

export function __can__(path: string[]) {
  return permissionsStore.check(path.join('.'))
}
```

Now you can write directives that stay type-safe:

```vue
<template>
  <button v-can="can.employee.view">View profile</button>
  <button v-if="isReady" v-can="can.employee.edit">
    Edit profile
  </button>
  <p v-cannot>Access denied</p>
</template>
```

…and the compiler rewrites them into plain conditionals:

```vue
<button v-if="__can__(['employee', 'view'])">View profile</button>
<button v-if="(isReady) && __can__(['employee', 'edit'])">Edit profile</button>
<p v-if="!(__can__(['employee', 'edit']))">Access denied</p>
```

## Usage Rules & Errors

The transformer validates every template and throws descriptive errors when:

- `v-cannot` does not immediately follow its matching `v-can`.
- `v-can` appears on an element already using `v-else` / `v-else-if`.
- `v-cannot` uses an argument, modifiers, or a `v-if` condition.
- Multiple `v-cannot` blocks exist for the same `v-can`.
- The expression is not a static dotted path like `can.resource.action`.

## Generated Types

The `permissions` map feeds a generated `types/nuxt-can.d.ts` declaration that augments:

- `ComponentCustomProperties` with `can`, `$can`, and `__can__`.
- `NuxtApp` with `$can` and `$__can__`.
- Runtime typings for the `#build/nuxt-can/can-import.mjs` bridge.

No extra setup is required for editors or strict TypeScript projects.

## Why `v-can`?

Retrofitting authorization into an existing codebase often means revisiting every `v-if` to sprinkle permission checks alongside business logic. That makes templates harder to read, increases the risk of regressions, and couples security rules with UI state management. `v-can` and `v-cannot` isolate the permission layer: you keep your original conditions untouched while the transformer injects the `__can__` guards for you. As a result, business logic stays readable, authorization lives in one place, and code reviews can focus on either concern without stepping on each other.

## Playground

Run `npm run dev` to explore the playground app located in `/playground`. It demonstrates:

- Stacked `v-can` / `v-cannot` pairs.
- Interaction with existing `v-if`s and `v-for`s.
- Template blocks that share the same permission guard.
- A live permission summary powered by the injected `__can__` function.

Feel free to wire your own `~/playground/permissions/__can__.ts` to mimic a real backend.

## Local Development

```bash
# Install dependencies
npm install

# Prepare type stubs and the playground
npm run dev:prepare

# Playground dev server
npm run dev

# Build the playground
npm run dev:build

# Lint & tests
npm run lint
npm run test
npm run test:watch

# Type checks (module + playground)
npm run test:types

# Release pipeline
npm run release
```

## Contributing

1. Fork & clone the repo.
2. Run `npm run dev:prepare` once to scaffold stubs.
3. Use the playground (`npm run dev`) to reproduce issues.
4. Add tests under `test/` and fixtures under `test/fixtures/*`.
5. Open a PR following Conventional Commits (e.g. `feat:`, `fix:`).

---

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-can/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-can

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-can.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-can

[license-src]: https://img.shields.io/npm/l/nuxt-can.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-can

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
