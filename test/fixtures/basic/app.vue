<template>
  <main>
    <h1>basic</h1>

    <section>
      <button
        id="can-view"
        v-can="can.employee.view"
      >
        Voir
      </button>

      <button
        v-if="isReady"
        id="can-edit"
        v-can="can.employee.edit"
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
        <p v-can="can.contract.create">
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
        v-can="can.employee.delete"
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
        {{ String(can.employee.view) }}
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
const isReady = true
const showContracts = true
</script>
