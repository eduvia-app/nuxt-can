# Roadmap – Plugin Nuxt `v-can` / `v-cannot`

Ce document sert de guide de travail pour construire le plugin Nuxt et son transformateur Vue associés. Il décrit les objectifs fonctionnels, les dépendances, ainsi que les phases successives pour livrer un module publiable.

---

## 🎯 Objectif produit

- Offrir des directives `v-can` / `v-cannot` lisibles permettant de contrôler le rendu des templates Nuxt via une fonction d’autorisation `__can__`.
- Générer automatiquement un objet proxy global `can` (accessible en template et typé) pour éviter tout bruit TypeScript.
- Remplacer chaque directive par des gardes `v-if` compilés (`__can__` ou `!__can__`) tout en fusionnant proprement avec des conditions existantes.
- Valider la config (permissions, import de `__can__`) à la compilation et produire des erreurs DX claires lorsque l’usage est incorrect.
- Intégrer proprement le module dans l’écosystème Nuxt (builder, runtime plugin, types, HMR, tests).

---

## 🔧 Pré-requis & Setup

1. **Module starter Nuxt**  
   - Utiliser la structure existante (`src/module.ts`, `src/runtime`, `playground`, `test`).
   - Installer les dépendances (`bun install`) puis lancer `bun run dev:prepare` pour générer les artefacts initiaux.

2. **Scripts utiles**  
   - `bun run dev` : playground pour tester rapidement les directives.  
   - `bun run lint`, `bun run test`, `bun run test:types` : validation de la qualité.  
   - `bun run prepack` / `bun run release` : build & publication.

3. **Convention de code**  
   - TypeScript, style Nuxt (2 espaces, single quotes).  
   - Préfixer les exports/composables avec un nom de module lorsque nécessaire.

---

## 🧭 Phases de développement

### 🚀 Phase 1 — Setup du module Nuxt
- Définir `defineNuxtModule` dans `src/module.ts` avec `meta`, `defaults`, `configKey`.
- Options visées :
  - `permissions: Record<string, string[]>`
  - `canFunctionImport: string` (chemin d’import vers la fonction `__can__`)
- Ajouter le transformateur via `nuxt.options.vue.compilerOptions.nodeTransforms`.
- Enregistrer le plugin runtime (`addPlugin`).
- Exposer les options côté runtime via `runtimeConfig.public`.

### 🚀 Phase 2 — Proxy global `can`
- Implémenter un proxy récursif dans `src/runtime/utils/can-proxy.ts` (ou équivalent) qui:
  - Retourne une string chemin (`employee.view`) tout en collectant les segments.
  - Supporte un nombre arbitraire de niveaux.
- Dans le plugin runtime, injecter `app.config.globalProperties.can` et l’injecter via provide/injection si utile.
- Générer les types `.d.ts` (via `addTypeTemplate`) à partir des permissions de la config Nuxt.

### 🚀 Phase 3 — Analyse AST
- Créer un fichier `src/runtime/transformers/can-directives.ts` (ou similaire) enregistré dans `nodeTransforms`.
- Lors du parcours :
  - Identifier directives `v-can` et `v-cannot`.
  - Associer chaque `v-cannot` au `v-can` précédent (même niveau DOM).
  - Extraire et valider l’expression `can.*.*` (interdire autres patterns).

### 🚀 Phase 4 — Transformation des nœuds `v-can`
- Convertir l’expression en chemin `['segment1','segment2',…]`.
- Chercher un `v-if` existant :
  - `v-if="expr"` → `v-if="__can__(path) && (expr)"`.
  - Sans `v-if` → ajouter `v-if="__can__(path)"`.
- Interdire `v-can` sur des éléments possédant déjà `v-else` / `v-else-if` (lever une erreur compilateur).

### 🚀 Phase 5 — Transformation des nœuds `v-cannot`
- Vérifier qu’un `v-can` immédiatement précédent existe et qu’aucun autre `v-cannot` n’est déjà lié.
- Générer un nouveau `v-if="!__can__(path)"` (jamais de merge avec d’autres `v-if`).
- Refuser toute expression ou argument sur `v-cannot`.

### 🚀 Phase 6 — Gestion des erreurs DX
- Cas à couvrir (throw via `context.error(...)` ou `nuxt.logger.fatal`):
  - `v-cannot` sans `v-can` voisin.
  - Multiples `v-cannot` pour le même `v-can`.
  - Expression `v-can` invalide ou dynamique non supportée.
  - Présence de `v-if` sur `v-cannot`.
  - `v-can` sur un nœud déjà structuré (`v-else`, `v-else-if`).
  - `v-cannot` avec une expression/argument.
- Rédiger des messages précis pour guider l’utilisateur.

### 🚀 Phase 7 — Intégration runtime
- Importer la fonction `__can__` depuis la chaîne `canFunctionImport`.
- L’injecter globalement (e.g. `nuxtApp.provide('__can__', canFn)` + `app.config.globalProperties.__can__ = canFn`).
- S’assurer que le proxy `can` appelle seulement des placeholders et que la logique réelle réside dans `__can__`.
- Vérifier compatibilité HMR (recharger templates/types via `updateTemplates` si nécessaire).

### 🚀 Phase 8 — Documentation
- Compléter `README.md` / `docs` :
  - Installation (`bun install`, `modules: ['nuxt-can']`).
  - Configuration (`permissions`, `canFunctionImport`).
  - Exemples `v-can`, `v-cannot`, cas avec `v-if`.
  - Limites connues (v-cannot isolé, interdiction v-else, etc.).

### 🚀 Phase 9 — Tests
- Unitaires (Vitest) sur le transformateur : couvrir chaque combinaison (simple, `v-if`, `v-for`, erreurs).
- Fixtures Nuxt sous `test/fixtures/*` pour valider l’injection runtime et les types.
- Playground : démontrer un scénario complet (liste d’employés, bouton conditionnel, message d’erreur).

---

## 📚 Exemples de transformation

### Exemple 1 — `v-can` simple
Avant :

```vue
<button v-can="can.employee.view">Voir le dossier</button>
```

Après compilation :

```vue
<button v-if="__can__('employee', 'view')">Voir le dossier</button>
```

### Exemple 2 — `v-if` + `v-can`
Avant :

```vue
<div v-if="isReady" v-can="can.contract.edit">
  Modifier le contrat
</div>
```

Après compilation :

```vue
<div v-if="__can__('contract', 'edit') && (isReady)">
  Modifier le contrat
</div>
```

### Exemple 3 — `v-can` suivi de `v-cannot`
Avant :

```vue
<button v-if="ctaVisible" v-can="can.employee.view">Voir</button>
<p v-cannot>Acces refuse</p>
```

Après compilation :

```vue
<button v-if="__can__('employee', 'view') && (ctaVisible)">Voir</button>
<p v-if="!__can__('employee', 'view')">Acces refuse</p>
```

### Exemple 4 — `v-if` / `v-else-if` / `v-else` + `v-can` / `v-cannot`

Usage attendu :

```vue
<template v-if="isOwner">
  <button v-can="can.employee.edit">Modifier</button>
  <p v-cannot>Contactez votre admin</p>
</template>
<template v-else-if="isManager">
  <p>Vue manager</p>
</template>
<template v-else>
  <p>Profil standard</p>
</template>
```

Résultat :

```vue
<template v-if="isOwner">
  <button v-if="__can__('employee', 'edit')">Modifier</button>
  <p v-if="!__can__('employee', 'edit')">Contactez votre admin</p>
</template>
<template v-else-if="isManager">
  <p>Vue manager</p>
</template>
<template v-else>
  <p>Profil standard</p>
</template>
```

⚠️ Règle : `v-can` ne peut pas se trouver sur un nœud utilisant `v-else` ou `v-else-if`. Encapsuler les branches dans un `<template>` et placer les directives seulement sur les éléments internes comme ci-dessus. (ça affichera une erreur si on utilise v-can sur un v-if/v-else ou v-if/v-if-else/v-else)

---

## 🗒️ Checklist exécution

- [ ] Phase 1 — Module configuré (`defineNuxtModule`, options, plugin runtime déclaré, transformateur enregistré).
- [ ] Phase 2 — Proxy `can` opérationnel + types `.d.ts` générés via `addTypeTemplate`.
- [ ] Phase 3 — Analyse AST implantée (détection `v-can`/`v-cannot`, parsing `can.foo.bar`).
- [ ] Phase 4 — Transformation `v-can` (fusion `v-if`, garde contre `v-else`).
- [ ] Phase 5 — Transformation `v-cannot` (lien direct au `v-can`, condition négative).
- [ ] Phase 6 — Gestion des erreurs compile-time (tous les cas listés couverts).
- [ ] Phase 7 — Intégration runtime (`__can__` importé/injecté, proxy exposé, HMR OK).
- [ ] Phase 8 — Documentation mise à jour (README + exemples).
- [ ] Phase 9 — Tests automatisés verts (unitaires, fixtures, playground vérifié).
- [ ] Release readiness — `bun run lint`, `bun run test`, `bun run test:types`, `bun run prepack`.

---

## ✅ Livrables attendus
- Module Nuxt compilable (`bun run prepack`) et partageable (`package.json` prêt à être packé).
- Types générés automatiquement et inclus dans `nuxt.d.ts`.
- Suite de tests verte (`bun run lint && bun run test && bun run test:types`).
- Documentation à jour (README + roadmap).

---

## 📌 Notes pratiques
- Organiser les helpers runtime dans `src/runtime` pour respecter la structure du module starter.
- Utiliser `createResolver(import.meta.url)` pour référencer les chemins des plugins/transformers/types.
- Pour tester dans une app externe : `bun pack` puis `bun install ../nuxt-can/my-module.tgz`.
- Garder des commits Conventional (`feat:`, `fix:`, etc.) pour préparer l’automatisation release.

---

Cette roadmap sert de référence pour planifier et suivre l’avancement du plugin `v-can`. Elle synthétise les besoins fonctionnels, les étapes techniques et les règles de qualité attendues avant publication.
