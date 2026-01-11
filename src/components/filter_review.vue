<template>
  <div class="filter_container">
    <div class="filter_group">
      <label for="rating-filter">Note:</label>
      <select 
        id="rating-filter" 
        v-model="selectedRating" 
        @change="applyFilters"
        class="filter-select"
      >
        <option value="">Toutes les notes</option>
        <option value="5">⭐⭐⭐⭐⭐ 5 étoiles</option>
        <option value="4">⭐⭐⭐⭐ 4 étoiles</option>
        <option value="3">⭐⭐⭐ 3 étoiles</option>
        <option value="2">⭐⭐ 2 étoiles</option>
        <option value="1">⭐ 1 étoile</option>
      </select>
    </div>

    <div class="filter_group">
      <label for="sort-filter">Trier par:</label>
      <select 
        id="sort-filter" 
        v-model="selectedSort" 
        @change="applyFilters"
        class="filter-select"
      >
        <option value="recent">Plus récents</option>
        <option value="oldest">Plus anciens</option>
        <option value="highest">Notes les plus élevées</option>
        <option value="lowest">Notes les plus basses</option>
      </select>
    </div>

    <button v-if="hasActiveFilters" @click="resetFilters" class="btn-reset">
      <i class="bi bi-x-circle"></i> Réinitialiser
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const selectedRating = ref('');
const selectedSort = ref('recent');
const hasActiveFilters = ref(false);

const emit = defineEmits<{
  filter: [{ rating: string; sort: string }]
}>();

const applyFilters = () => {
  hasActiveFilters.value = selectedRating.value !== '';
  emit('filter', {
    rating: selectedRating.value,
    sort: selectedSort.value
  });
};

const resetFilters = () => {
  selectedRating.value = '';
  selectedSort.value = 'recent';
  hasActiveFilters.value = false;
  emit('filter', {
    rating: '',
    sort: 'recent'
  });
};
</script>

<style lang="scss" scoped>
.filter_container {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 15px;
  background: var(--light-color);
  border-radius: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.filter_group {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
    white-space: nowrap;
  }
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid var(--secondary-color-tint);
  border-radius: 6px;
  font-size: 13px;
  color: var(--primary-color);
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary-color);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(23, 32, 42, 0.1);
  }
}

.btn-reset {
  padding: 6px 12px;
  background-color: transparent;
  border: 1px solid var(--danger-color);
  border-radius: 6px;
  color: var(--danger-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &:hover {
    background-color: rgba(183, 58, 78, 0.1);
  }

  i {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .filter_container {
    flex-direction: column;
    gap: 10px;
  }

  .filter_group {
    width: 100%;

    label {
      min-width: 60px;
    }
  }

  .filter-select {
    flex: 1;
  }

  .btn-reset {
    width: 100%;
    justify-content: center;
  }
}
</style>