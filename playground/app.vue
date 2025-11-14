<template>
  <main class="page">
    <div v-can="can.baz.dskj">
      foo.bar
    </div>
    <div v-cannot>
      cannot
    </div>
  </main>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page {
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

section {
  margin-top: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fff;
}

.card h2 {
  margin-top: 0;
}

button {
  margin-right: 0.75rem;
}

.ghost {
  background: transparent;
  border: 1px solid #cbd5f5;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
}

.toggle {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  margin-top: 0.75rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  border-bottom: 1px solid #edf2f7;
}

li:last-child {
  border-bottom: 0;
}

.allowed {
  color: #15803d;
}

.denied {
  color: #b91c1c;
}
</style>
