<template>
  <div class="search-container">
    <div class="search-wrapper">
      <i class="bi bi-search search-icon"></i>
      <input
        v-model="searchQuery"
        @keyup.enter="onSearch"
        type="text"
        class="search-input"
        placeholder="Rechercher un article, un groupe, un membre..."
      />
      <button class="search-submit" @click="onSearch" aria-label="Rechercher">
        <i class="bi bi-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

  <script lang="ts">
    import { useRoute, useRouter } from "vue-router";

    export default {
        name: "search_bar",
        props: {},
        data() {
            return {
                searchQuery: '',
            };
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            return { route, router };
        },
        methods: {
            onSearch() {
                const combined = this.$func.buildCombinedSlug(this.searchQuery, 'search');
                this.router.push({
                    name: 'searchList',
                    params: { combined }
                });
            },
        }
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
      box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1), var(--shadow-md);
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
    color: white;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 16px rgba(255, 45, 120, 0.4);
    }
  }

  @media (max-width: 640px) {
    .search-wrapper {
      max-width: 100%;
    }
  }
  </style>
