<template>
    <main class="page">
        <Nav_bar></Nav_bar>
        <popup_add_item v-if="isPopupVisible" @close="isPopupVisible=false"></popup_add_item>

        <!-- Deletion scheduled banner -->
        <div v-if="deletionDate" class="deletion-banner">
          <div class="deletion-banner__content">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>
              Votre compte sera supprimé le <strong>{{ formatDate(deletionDate) }}</strong>.
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
          </div>

          <!-- Favorites -->
          <section v-if="productFavorites.products && productFavorites.products.length > 0" class="dashboard-section stagger-children">
            <div class="section-header">
              <h2 class="section-header__title">
                <i class="bi bi-heart-fill" style="color: var(--accent-pink)"></i>
                Tes favoris
              </h2>
              <button class="btn btn-ghost btn-sm" @click="loadMore({ products: productFavorites.products, pagination: productFavorites.pagination, type: 'Favorites' })">
                Voir tout <i class="bi bi-arrow-right"></i>
              </button>
            </div>
            <row_products @voirPlus="loadMore" :moreBtn="false" :pagination="productFavorites.pagination" :dataList="productFavorites.products"></row_products>
          </section>

          <!-- Recommendations -->
          <section v-if="productRecommendations.length > 0" class="dashboard-section stagger-children">
            <div class="section-header">
              <h2 class="section-header__title">
                <i class="bi bi-stars"></i>
                Recommandé pour toi
              </h2>
            </div>
            <Grid :moreBtn="true" :pagination="paginationTab" :dataList="productRecommendations"></Grid>
          </section>

          <!-- Feed -->
          <section v-if="dataCardList && dataCardList.length > 0" class="dashboard-section stagger-children">
            <div class="section-header">
              <h2 class="section-header__title">
                <i class="bi bi-grid-3x3-gap"></i>
                Fil d'actu
              </h2>
            </div>
            <Grid :moreBtn="true" :pagination="paginationTab" :dataList="dataCardList"></Grid>
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

  <script lang="ts">
    import { defineComponent } from 'vue';
    import { useRouter } from "vue-router";

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar from '@/components/search_bar.vue';
    import row_products from '@/components/row_products.vue';
    import postService from '@/services/post.service';
    import authentification from '@/services/authentification.service';
    import Cookies from "js-cookie";
    import axios from "axios";
    import { API_URL } from '@/config/api';

  export default defineComponent({
    name: 'dashboard',
    components: {
      Nav_bar,
      Popup_add_item,
      search_bar,
      row_products
    },
    mounted() {
      authentification.verifSession().then(() => {
        this.getFav();
        this.getRecommendations();
        this.getPosts(12);
        this.loadDeletionStatus();
      }).catch(() => {
        // Session invalid - user will be redirected to login
      });
    },
    setup() {
      const router = useRouter();
      return { router };
    },
    data(): {
      isPopupVisible: boolean;
      dataCardList: any[],
      paginationTab: any,
      productRecommendations: any[],
      productFavorites: { pagination: any; products: any[]; },
      deletionDate: string | null,
    } {
      return {
        isPopupVisible: false,
        productRecommendations: [],
        dataCardList: [],
        paginationTab: {},
        productFavorites: { pagination: {}, products: [] },
        deletionDate: null,
      };
    },
    methods: {
      showPopup() {
        this.isPopupVisible = true;
      },
      async getRecommendations(){
        const products = await postService.getRecommendations();
        this.productRecommendations = products;
      },
      getPosts(limit = 12) {
        postService.getPosts(limit).then((posts) => {
          this.dataCardList = posts.products;
          this.paginationTab = posts.pagination;
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      },
      getFav(){
        postService.getFavorites(10).then((posts) => {
          this.productFavorites = posts;
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      },
      loadMore({ products, pagination, type }: { products: any[]; pagination: any[], type: '' }) {
        sessionStorage.setItem('posts_str', JSON.stringify(products));
        sessionStorage.setItem('pagination_str', JSON.stringify(pagination));
        const combined = this.$func.buildCombinedSlug('', 'more'+type);
        this.router.push({
            name: 'searchList',
            params: { combined }
        });
      },
      async loadDeletionStatus() {
        try {
          const sessionToken = Cookies.get('sessionToken');
          const res = await axios.get(`${API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${sessionToken}` }
          });
          const profile = res.data?.user || res.data;
          this.deletionDate = profile?.scheduledDeletionDate || null;
        } catch {
          this.deletionDate = null;
        }
      },
      formatDate(iso: string) {
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      },
      goToSettings() {
        this.router.push('/adherents/settings');
      },
    },
  })
  </script>

<style lang="scss" scoped>
// Deletion banner
.deletion-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: rgba(220, 53, 69, 0.08);
  border-bottom: 1px solid rgba(220, 53, 69, 0.2);
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  &__content {
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    i { color: #dc3545; font-size: 1.25rem; flex-shrink: 0; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: var(--radius-full);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover { background: #c82333; }
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
    border-color: rgba(255, 45, 120, 0.3);
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
