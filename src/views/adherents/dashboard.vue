<template>
    <main class="page">

        <!-- Deletion scheduled banner -->
        <div v-if="deletionDate" class="deletion-banner">
          <div class="deletion-banner__content">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>
              Votre compte sera supprimé le <strong>{{ formatDate(deletionDate, 'long') }}</strong>.
              Vous pouvez encore annuler cette demande.
            </span>
          </div>
          <button class="deletion-banner__btn" @click="goToSettings">
            Gérer <i class="bi bi-arrow-right"></i>
          </button>
        </div>

        <!-- Hero / Search banner -->
        <section class="hero">
          <div class="hero__bg"></div>
          <div class="hero__content">
            <h1 class="hero__title">Trouve ta prochaine <span class="text-accent">pépite K-pop</span></h1>
            <p class="hero__subtitle">Photocards, albums, merch... explore des milliers d'articles</p>
            <search_bar class="hero__search"></search_bar>
          </div>
        </section>

        <!-- Main content -->
        <div class="dashboard-content">
          <!-- Quick links -->
          <div class="quick-links">
            <button class="quick-link" @click="$router.push('/adherents/payments')">
              <i class="bi bi-receipt"></i>
              <span>Mes paiements</span>
            </button>
            <button class="quick-link" @click="$router.push('/adherents/collection')">
              <i class="bi bi-collection"></i>
              <span>Ma collection</span>
            </button>
            <button class="quick-link" @click="$router.push('/adherents/messages')">
              <i class="bi bi-chat-dots"></i>
              <span>Messages</span>
            </button>
            <button class="quick-link" @click="$router.push({ name: 'followed_groups' })">
              <i class="bi bi-stars"></i>
              <span>Mes groupes suivis</span>
            </button>
          </div>

          <DashboardFeed />

          <!-- Favorites -->
          <section v-if="productFavorites.products && productFavorites.products.length > 0" class="dashboard-section stagger-children">
            <div class="section-header">
              <h2 class="section-header__title">
                <i class="bi bi-heart-fill section-header__icon--fav"></i>
                Tes favoris
              </h2>
              <button class="btn btn-ghost btn-sm" @click="loadMore({ products: productFavorites.products, pagination: productFavorites.pagination, type: 'Favorites' })">
                Voir tout <i class="bi bi-arrow-right"></i>
              </button>
            </div>
            <row_products :more-btn="false" :pagination="productFavorites.pagination" :data-list="productFavorites.products" @voir-plus="loadMore"></row_products>
          </section>

          <!-- Recommendations -->
          <section v-if="productRecommendations.length > 0" class="dashboard-section stagger-children">
            <div class="section-header">
              <h2 class="section-header__title">
                <i class="bi bi-stars"></i>
                Recommandé pour toi
              </h2>
            </div>
            <Grid :more-btn="true" :pagination="paginationTab" :data-list="productRecommendations"></Grid>
          </section>

          <!-- Feed -->
          <section v-if="dataCardList && dataCardList.length > 0" class="dashboard-section stagger-children">
            <div class="section-header">
              <h2 class="section-header__title">
                <i class="bi bi-grid-3x3-gap"></i>
                Fil d'actu
              </h2>
            </div>
            <Grid :more-btn="true" :pagination="paginationTab" :data-list="dataCardList"></Grid>
          </section>

          <!-- Empty state -->
          <section v-if="!dataCardList?.length && !productRecommendations.length" class="empty-state">
            <div class="empty-state__icon">
              <i class="bi bi-box-seam"></i>
            </div>
            <h3>Rien à afficher pour l'instant</h3>
            <p class="text-muted">Les produits apparaîtront ici dès qu'il y en aura !</p>
          </section>
        </div>
    </main>
  </template>

  <script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';

    import search_bar from '@/components/search_bar.vue';
    import row_products from '@/components/row_products.vue';
    import Grid from '@/components/grid.vue';
    import DashboardFeed from '@/components/DashboardFeed.vue';
    import postService from '@/services/post.service';
    import authentification from '@/services/authentification.service';
    import accountService from '@/services/account.service';
    import type { Post, PostsResponse } from '@/types/post.types';
    import { formatDate } from '@/utils/format';
    import { searchRoute } from '@/router/searchRoute';

    defineOptions({ name: 'DashboardView' });

    type ListPagination = PostsResponse['pagination'];

    const router = useRouter();

    const productRecommendations = ref<Post[]>([]);
    const dataCardList = ref<Post[]>([]);
    const paginationTab = ref<Partial<ListPagination>>({});
    const productFavorites = ref<{ pagination: Partial<ListPagination>; products: Post[] }>({ pagination: {}, products: [] });
    const deletionDate = ref<string | null>(null);

    async function getRecommendations() {
      productRecommendations.value = await postService.getRecommendations();
    }

    function getPosts(limit = 12) {
      postService.getPosts(limit).then((posts) => {
        dataCardList.value = posts.products;
        paginationTab.value = posts.pagination;
      }).catch((error) => {
        console.error('Erreur lors de la récupération des posts:', error);
      });
    }

    function getFav() {
      postService.getFavorites(10).then((posts) => {
        productFavorites.value = posts;
      }).catch((error) => {
        console.error('Erreur lors de la récupération des posts:', error);
      });
    }

    function loadMore({ products, pagination, type }: { products: Post[]; pagination: Partial<ListPagination>; type: string }) {
      sessionStorage.setItem('posts_str', JSON.stringify(products));
      sessionStorage.setItem('pagination_str', JSON.stringify(pagination));
      router.push(searchRoute({ event: 'more' + type }));
    }

    async function loadDeletionStatus() {
      try {
        const profile = await accountService.getProfile<{ scheduledDeletionDate?: string | null }>();
        deletionDate.value = profile?.scheduledDeletionDate || null;
      } catch {
        deletionDate.value = null;
      }
    }

    function goToSettings() {
      router.push('/adherents/settings');
    }

    onMounted(() => {
      authentification.verifSession().then(() => {
        getFav();
        void getRecommendations();
        getPosts(12);
        void loadDeletionStatus();
      }).catch(() => {
        // Session invalide : l'utilisateur est redirigé vers /login.
      });
    });
  </script>

<style lang="scss" scoped>
// Deletion banner
.deletion-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
  border-bottom: 1px solid var(--danger-border);
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  &__content {
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    i { color: var(--danger-text); font-size: 1.25rem; flex-shrink: 0; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--danger);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-full);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover { filter: brightness(0.9); }
  }
}

// Quick links
.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.quick-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);

  i {
    font-size: 1.5rem;
    color: var(--accent-pink);
    transition: transform var(--transition-fast);
  }

  &:hover {
    border-color: color-mix(in srgb, var(--accent-pink) 30%, transparent);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);

    i { transform: scale(1.1); }
  }
}

// Hero section
.hero {
  position: relative;
  padding: var(--space-3xl) var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background: var(--accent-gradient-subtle);
  border-bottom: 1px solid var(--surface-border);
}

.hero__content {
  position: relative;
  text-align: center;
  max-width: 600px;
  animation: fadeInUp 0.6s ease;
}

.hero__title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  margin-bottom: var(--space-sm);
  line-height: var(--leading-tight);
}

.hero__subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-xl);
}

.hero__search {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

// Dashboard content
.dashboard-content {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
}

.dashboard-section {
  margin-bottom: var(--space-2xl);
}

// Section header
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.section-header__title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;

  i {
    font-size: 1.2em;
  }

  .section-header__icon--fav {
    color: var(--accent-pink);
  }
}

// Empty state
.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.empty-state__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  font-size: 2rem;
  color: var(--text-muted);
}

// Responsive
@media (max-width: 640px) {
  .hero {
    min-height: 250px;
    padding: var(--space-2xl) var(--space-md);
  }

  .hero__title {
    font-size: var(--font-size-2xl);
  }

  .hero__subtitle {
    font-size: var(--font-size-base);
  }

  .dashboard-content {
    padding: var(--space-lg) var(--space-md);
  }
}
</style>
