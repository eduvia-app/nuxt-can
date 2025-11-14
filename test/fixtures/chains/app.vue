<template>
  <main>
    <section>
      <div id="branch-draft" v-if="phase === 'draft'" v-can="can.employee.view">
        Draft
      </div>
      <div id="branch-pending" v-else-if="phase === 'pending'">
        Pending
      </div>
      <div id="branch-fallback" v-else>
        Fallback
      </div>
      <p id="branch-denied" v-cannot>
        Permission missing
      </p>
    </section>

    <section>
      <button id="approve-action" v-can="can.contract.approve">
        Approve
      </button>
      <p id="explicit-denied" v-cannot="can.contract.approve">
        Need contract.approve
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
const phase = 'pending'
</script>
