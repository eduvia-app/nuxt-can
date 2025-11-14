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
npm install @eduvia-app/nuxt-can
# or
npx nuxi module add @eduvia-app/nuxt-can
```

Enable it inside `nuxt.config.ts` and describe the permissions tree:

```ts
// nuxt.config.ts
import NuxtCan from '@eduvia-app/nuxt-can'

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

export function __can__(...path: string[]) {
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
<button v-if="__can__('employee', 'view')">View profile</button>
<button v-if="__can__('employee', 'edit') && (isReady)">Edit profile</button>
<p v-if="!(__can__('employee', 'edit'))">Access denied</p>
```

## Directive Patterns

### Guard entire `v-if` / `v-else-if` / `v-else` chains

Once the first branch of a conditional chain carries `v-can`, the transformer automatically mirrors that guard (with the same permission path) on every subsequent `v-else-if` and `v-else`. You can still repeat the directive manually for clarity, but it’s no longer required.

```vue
<div v-if="status === 'draft'" v-can="can.foo.bar">
  Draft state
</div>
<div v-else-if="status === 'pending'">
  Pending state
</div>
<div v-else>
  Fallback state
</div>
<div v-cannot="can.foo.bar">
  Missing permission
</div>
```

Transforms into:

```vue
<div v-if="__can__('foo', 'bar') && (status === 'draft')">
  Draft state
</div>
<div v-else-if="__can__('foo', 'bar') && (status === 'pending')">
  Pending state
</div>
<div v-else-if="__can__('foo', 'bar')">
  Fallback state
</div>
<div v-if="!__can__('foo', 'bar')">
  Missing permission
</div>
```

### Pass arguments to `v-cannot`

`v-cannot` can mirror the permission expression used by its matching `v-can` by adding the same argument (`v-cannot="can.foo.bar"`). When no argument is specified, the directive must immediately follow the preceding `v-can` block so the transformer can re-use that context.

```vue
<button v-can="can.contract.submit">Submit contract</button>
<p v-cannot="can.contract.submit">Contact your admin to unlock submissions.</p>

<template>
  <button v-if="isReady" v-can="can.contract.edit">Edit</button>
  <p v-cannot>Only editors can update this contract.</p>
</template>

<!-- Need to wrap the fallback? pass the expression explicitly -->
<div class="notice">
  <p v-cannot="can.contract.edit">Only editors can update this contract.</p>
</div>
```

Both `v-cannot` branches above compile to `v-if="!__can__('contract', 'submit')"` and `v-if="!__can__('contract', 'edit')"` respectively.

### Keep `v-cannot` next to its `v-can`

When `v-cannot` omits an expression, it must immediately follow the guarded block:

```vue
<div v-if="isReady" v-can="can.foo.bar">Ready!</div>
<p v-cannot>Not allowed</p> <!-- ✅ adjacent, guard is inferred -->

<div>
  <p v-cannot>Not allowed</p> <!-- ❌ wrapped, missing explicit expression -->
</div>

<div>
  <p v-cannot="can.foo.bar">Not allowed</p> <!-- ✅ wrapper + explicit permission -->
</div>
```

## Usage Rules & Errors

The transformer validates every template and throws descriptive errors when:

- `v-can` expressions differ within the same `v-if` / `v-else-if` / `v-else` block (the guard is mirrored automatically, but mixed expressions are disallowed).
- `v-cannot` without an argument is separated from its originating `v-can`.
- `v-cannot` mixes in modifiers or a `v-if` condition (keep it standalone).
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
[npm-version-src]: https://img.shields.io/npm/v/%40eduvia-app%2Fnuxt-can/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@eduvia-app/nuxt-can

[npm-downloads-src]: https://img.shields.io/npm/dm/%40eduvia-app%2Fnuxt-can.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@eduvia-app/nuxt-can

[license-src]: https://img.shields.io/npm/l/%40eduvia-app%2Fnuxt-can.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@eduvia-app/nuxt-can

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
