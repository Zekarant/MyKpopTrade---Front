<template>
  <div class="search-container">
    <div class="search-wrapper">
      <i class="bi bi-search search-icon"></i>
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Rechercher un article, un groupe, un membre..."
        aria-label="Rechercher un article, un groupe, un membre"
        @keyup.enter="onSearch"
      />
      <button class="search-submit" aria-label="Rechercher" @click="onSearch">
        <i class="bi bi-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

  <script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { searchRoute } from '@/router/searchRoute';

    defineOptions({ name: 'SearchBar' });

    const router = useRouter();
    const searchQuery = ref('');

    function onSearch() {
        router.push(searchRoute({ q: searchQuery.value }));
    }
  </script>

  <style scoped lang="scss">
  .search-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .search-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 520px;
    background: var(--bg-tertiary);
    border: 1.5px solid var(--surface-border);
    border-radius: var(--radius-full);
    padding: 4px 6px 4px 20px;
    transition: all var(--transition-base);
    gap: var(--space-sm);

    &:focus-within {
      border-color: var(--accent-pink);
      box-shadow: var(--focus-ring), var(--shadow-md);
      background: var(--bg-secondary);
    }
  }

  .search-icon {
    color: var(--text-muted);
    font-size: 1rem;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    padding: 12px 8px;
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: var(--text-muted);
    }
  }

  .search-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--accent-gradient);
    border: none;
    border-radius: var(--radius-full);
    color: var(--text-on-accent);
    font-size: 1.1rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 16px color-mix(in srgb, var(--accent-pink) 40%, transparent);
    }
  }

  @media (max-width: 640px) {
    .search-wrapper {
      max-width: 100%;
    }
  }
  </style>
