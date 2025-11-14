<template>
  <main>
    <h1>basic</h1>

    <section>
      <button
        id="can-view"
        v-can="canProxy.employee.view"
      >
        Voir
      </button>

      <button
        v-if="isReady"
        id="can-edit"
        v-can="canProxy.employee.edit"
      >
        Editer
      </button>
      <p
        id="cannot-edit"
        v-cannot
      >
        Refus
      </p>
    </section>

    <section>
      <template v-if="showContracts">
        <p v-can="canProxy.contract.create">
          Creation contrat
        </p>
        <p v-cannot>
          Pas de creation
        </p>
      </template>
      <p v-else>
        Section contrats masquee, aucune directive appliquee.
      </p>
    </section>

    <section>
      <h2>Suppression</h2>
      <button
        id="can-delete"
        v-can="canProxy.employee.delete"
      >
        Supprimer
      </button>
      <p
        id="cannot-delete"
        v-cannot
      >
        Suppression interdite
      </p>
    </section>

    <section>
      <p id="path-display">
        {{ String(canProxy.employee.view) }}
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
const isReady = true
const showContracts = true
interface FixturePermissions {
  employee: {
    view: boolean
    edit: boolean
    delete: boolean
  }
  contract: {
    create: boolean
  }
}

const nuxtApp = useNuxtApp()
const canProxy = nuxtApp.$can as unknown as FixturePermissions
</script>
