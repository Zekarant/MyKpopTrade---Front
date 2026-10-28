<template>
  <nav v-if="pages > 1" class="admin__pagination" aria-label="Pagination">
    <button
      type="button"
      class="admin__icon-btn"
      aria-label="Page précédente"
      :disabled="page <= 1"
      @click="emit('change', page - 1)"
    >
      <i class="bi bi-chevron-left" aria-hidden="true"></i>
    </button>
    <span aria-live="polite"><slot>{{ page }} / {{ pages }}</slot></span>
    <button
      type="button"
      class="admin__icon-btn"
      aria-label="Page suivante"
      :disabled="page >= pages"
      @click="emit('change', page + 1)"
    >
      <i class="bi bi-chevron-right" aria-hidden="true"></i>
    </button>
  </nav>
</template>

<script setup lang="ts">
/** Pagination des listes de l'administration. Le texte central se remplace par le slot. */
defineProps<{ page: number; pages: number }>();

const emit = defineEmits<{ change: [page: number] }>();
</script>
