<template>
    <main class="page">
      <Nav_bar></Nav_bar>
      <div class="collection">
        <div class="collection__header">
          <h1 class="collection__title">
            <i class="bi bi-collection"></i>
            Ma collection
          </h1>
          <p class="collection__subtitle">Tous les articles que tu as mis en vente</p>
        </div>

        <div class="collection__tabs">
          <button
            class="collection__tab"
            :class="{ 'collection__tab--active': activeTab === 'available' }"
            @click="switchTab('available')"
          >En vente</button>
          <button
            class="collection__tab"
            :class="{ 'collection__tab--active': activeTab === 'sold' }"
            @click="switchTab('sold')"
          >Vendus</button>
          <button
            class="collection__tab"
            :class="{ 'collection__tab--active': activeTab === 'favorites' }"
            @click="switchTab('favorites')"
          >Favoris</button>
        </div>

        <div v-if="loading" class="collection__loading">
          <div class="skeleton" style="width: 200px; height: 200px;"></div>
          <div class="skeleton" style="width: 200px; height: 200px;"></div>
          <div class="skeleton" style="width: 200px; height: 200px;"></div>
        </div>

        <Grid v-else-if="products.length > 0" :admin="true" :dataList="products" :pagination="pagination" :moreBtn="pagination.page < pagination.pages"></Grid>

        <div v-else class="collection__empty">
          <i class="bi" :class="activeTab === 'favorites' ? 'bi-heart' : 'bi-box-seam'"></i>
          <h3 v-if="activeTab === 'available'">Aucun article en vente</h3>
          <h3 v-else-if="activeTab === 'sold'">Aucun article vendu</h3>
          <h3 v-else>Aucun favori</h3>
          <p class="text-muted">Les articles apparaîtront ici</p>
          <button v-if="activeTab === 'available'" class="btn btn-primary" @click="$router.push({ name: 'add_post' })">
            <i class="bi bi-plus-lg"></i> Créer une annonce
          </button>
        </div>
      </div>
    </main>
  </template>

  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import authentification from '@/services/authentification.service';
    import postService from '@/services/post.service';
    import Nav_bar from '@/components/adherents/nav_bar.vue';

  export default defineComponent({
    name: 'collection',
    components: {
      Nav_bar,
    },
    setup() {
      const products = ref<any[]>([]);
      const loading = ref(true);
      const activeTab = ref('available');
      const pagination = ref({ page: 1, pages: 1, limit: 20 });

      return { products, loading, activeTab, pagination };
    },
    mounted() {
      authentification.verifSession().then(() => {
        this.loadProducts();
      }).catch(() => {});
    },
    methods: {
      switchTab(tab: string) {
        this.activeTab = tab;
        this.pagination = { page: 1, pages: 1, limit: 20 };
        this.loadProducts();
      },
      async loadProducts() {
        this.loading = true;
        try {
          if (this.activeTab === 'favorites') {
            const data = await postService.getFavorites(this.pagination.limit, this.pagination.page);
            this.products = data.products || [];
            this.pagination = data.pagination || this.pagination;
          } else {
            const data = await postService.getInventory(this.activeTab, this.pagination.limit, this.pagination.page);
            this.products = data.products || [];
            this.pagination = data.pagination || this.pagination;
          }
        } catch (error) {
          console.error('Erreur chargement collection:', error);
          this.products = [];
        } finally {
          this.loading = false;
        }
      }
    }
  })
  </script>

<style lang="scss" scoped>
.collection {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
}

.collection__header {
  margin-bottom: var(--space-xl);
}

.collection__title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0 0 var(--space-xs);

  i { color: var(--accent-pink); }
}

.collection__subtitle {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

.collection__tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-xl);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: var(--space-xs);
}

.collection__tab {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  transition: all var(--transition-fast);
  position: relative;

  &:hover { color: var(--text-primary); }

  &--active {
    color: var(--accent-pink);

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent-pink);
      border-radius: 2px 2px 0 0;
    }
  }
}

.collection__loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}

.collection__empty {
  text-align: center;
  padding: var(--space-3xl);

  // `> i` : sans le sélecteur d'enfant direct, l'icône du bouton « Créer une
  // annonce » héritait aussi de ces 3rem et du `display: block`.
  > i {
    font-size: 3rem;
    color: var(--text-muted);
    margin-bottom: var(--space-md);
    display: block;
  }

  h3 {
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    margin: 0 0 var(--space-xs);
  }

  .btn {
    margin-top: var(--space-lg);
  }
}
</style>
