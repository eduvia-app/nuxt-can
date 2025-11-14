<template>
  <main class="page">
    <section class="card">
      <h1>`v-can` example</h1>

      <div v-if="phase === 'draft'" v-can="can.foo.bar" class="block">
        Draft branch
      </div>
      <div v-else-if="phase === 'pending'" class="block">
        Pending branch
      </div>
      <div v-else class="block">
        Fallback branch
      </div>
      <div v-cannot class="denied">
        Missing `can.foo.bar` permission
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const phase = 'pending'
</script>

<style scoped>
.page {
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  background: #fff;
  max-width: 32rem;
}

.block {
  border: 1px dashed #cbd5f5;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-block: 0.5rem;
}

.denied {
  margin-top: 1rem;
  color: #b91c1c;
}
</style>
