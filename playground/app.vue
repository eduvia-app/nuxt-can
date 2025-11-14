<template>
  <button v-if="true" id="btn-view" v-can="true">
    Voir le dossier 2
  </button>
  <div v-cannot>
    v-else
  </div>

  <button v-if="isReady && can.employee.edit" id="btn-edit" v-can="true">
    Modifier le dossier
  </button>
</template>

<script setup lang="ts">
const isReady = true
const can = {
  employee: {
    view: 'view_employee',
    edit: 'edit_employee',
  },
}
</script>

<style scoped>
.page {
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

section {
  margin-top: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fff;
}

button {
  margin-right: 0.75rem;
}
</style>
