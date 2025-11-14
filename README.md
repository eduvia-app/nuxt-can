# nuxt-can

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

`nuxt-can` apporte deux directives Vue (`v-can`, `v-cannot`) pour écrire des permissions ultra lisibles dans les templates Nuxt. Les directives sont transformées à la compilation en appels à une fonction `__can__` fournie par l’application hôte tout en restant 100 % tree-shake friendly et parfaitement typées côté TypeScript.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- ✅ Directives `v-can` / `v-cannot` transformées en `v-if` / `!v-if`
- ✅ Merge automatique avec des `v-if` existants (pas de runtime inutile)
- ✅ Proxy global `can` + types générés selon votre configuration de permissions
- ✅ Import configurable de la fonction `__can__` (store, API, …)
- ✅ Erreurs compile-time claires (cas interdits détectés avant build)

## Quick Setup

Installez le module dans votre application Nuxt :

```bash
npm install nuxt-can
# ou
npx nuxi module add nuxt-can
```

Déclarez ensuite le module et configurez vos permissions :

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
    canFunctionImport: '~/permissions/can', // chemin vers votre implémentation __can__
  },
})
```

Implémentez la fonction `__can__` dans le fichier ciblé (`~/permissions/can` dans l’exemple) :

```ts
// permissions/can.ts
const permissionsStore = usePermissionsStore()

export function __can__(path: string[]) {
  return permissionsStore.check(path.join('.'))
}
```

Le module génère automatiquement un proxy `can` typé :

```vue
<template>
  <button v-can="can.employee.view">Voir le dossier</button>
  <button v-if="isReady" v-can="can.employee.edit">
    Modifier
  </button>
  <p v-cannot>Accès refusé</p>
</template>
```

Résultat compilé :

```vue
<button v-if="__can__(['employee', 'view'])">Voir le dossier</button>
<button v-if="(isReady) && __can__(['employee', 'edit'])">Modifier</button>
<p v-if="!(__can__(['employee', 'edit']))">Accès refusé</p>
```

### Règles et erreurs surveillées

- `v-cannot` doit suivre immédiatement un `v-can` (aucun autre composant entre les deux).
- Un `v-can` ne peut pas cohabiter avec `v-else` / `v-else-if`.
- `v-cannot` n’accepte ni expression, ni argument, ni `v-if`.
- Un seul `v-cannot` par `v-can`.
- Les expressions doivent suivre le pattern `can.x.y` (au moins deux niveaux après `can`).

Toute violation produit une erreur compile-time lisible.

### Types générés

À partir de la clé `permissions`, le module génère un fichier `.d.ts` qui expose :

- `can` / `$can` sur `ComponentCustomProperties`
- `__can__` sur les templates/scripts Nuxt
- `NuxtApp.$can` et `NuxtApp.$__can__`

La DX template + TypeScript reste donc impeccable sans configuration additionnelle.


## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/my-module/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/my-module

[npm-downloads-src]: https://img.shields.io/npm/dm/my-module.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/my-module

[license-src]: https://img.shields.io/npm/l/my-module.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/my-module

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
