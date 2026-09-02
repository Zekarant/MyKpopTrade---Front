<template>
    <main class="page">
        <Nav_bar @toggle-popup-add="showPopup"></Nav_bar>
        <popup_add_item v-if="isPopupVisible" @close="isPopupVisible=false"></popup_add_item>
        <div class="content" style="display: flex;">
          <div style="width: 2%;"></div>
          <div v-if="!isMobile" class="filter_content">
            <filter_list @saveFilter="applyFilter"></filter_list>
          </div>
          <div style="width: 2%;"></div>
          <div class="content_grid" ref="scrollContainer">
            <search_bar_2  :query="queryLocal" :filters="filters" @search="searchEvent" class="search_bar_content"></search_bar_2>
            <div class="title_content" style="font-weight: bold; font-size: 20px;margin-left: 24px;">
              <span class="result_title">
                <template v-if="event === 'morePageFavorites'">Mes favoris</template>
                <template v-else-if="queryLocal">Résultat de la recherche : {{ queryLocal }}</template>
                <template v-else>Tous les articles</template>
              </span>
              <div v-if="isMobile" class="filter_content">
                <filter_list @saveFilter="applyFilter"></filter_list>
              </div>
            </div>
            <br>
            <Grid :dataList="posts"></Grid>
            <div v-if="pagination.page < pagination.pages" class="load-more-wrap">
              <button class="load-more-btn" @click="loadMoreResults">Voir plus de résultats</button>
            </div>
            <img v-if="loading" class="imgcenter" style="height: 50px;" src="../../assets/images/infinity_scroll.gif">
          </div>

          <div style="width: 5%;"></div>

        </div>



    </main>
  </template>

  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useInfiniteScroll } from '@vueuse/core'
    import { useRoute, useRouter } from 'vue-router';
    import postService from '@/services/post.service';
    import searchService from '@/services/search.service';

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar_2 from '@/components/search_bar_2.vue';
    import filter_list from '@/components/filter_list.vue';

    /** Filtres émis par `filter_list` via `saveFilter`. */
    interface SearchFilters {
      min: number | null;
      max: number | null;
      /** Le `<select>` n'en renvoie qu'un ; le tableau reste toléré par sécurité. */
      conditions: string | string[] | null;
      type: string | null;
      group: string | null;
      member: string | null;
    }

  export default defineComponent({
    name: 'searchList',
    components: {
      Nav_bar,
      Popup_add_item,
      search_bar_2,
      filter_list
    },
    setup(props) {
      const route = useRoute();
      const router = useRouter();

      const scrollContainer = ref<HTMLElement | null>(null);
      const isLoadingMore = ref(false);
      const pagination = ref({
        limit: 10,
        page: 1,
        pages: 1
      });

      let loading = false;
      const posts = ref<any[]>([]);

      // Fonction pour charger plus



      const loadMoreData = async () => {
        loading = true;
        if (isLoadingMore.value) return;
        if (pagination.value.page >= pagination.value.pages) return; // plus de pages

        isLoadingMore.value = true;
        pagination.value.page++;

        try {
          const postsServiceItems = await postService.getPosts(pagination.value.limit, pagination.value.page);
          postsServiceItems.products.forEach((post: any) => {
            posts.value.push(post);
          });
          pagination.value.pages = postsServiceItems.pagination.pages;
        } catch (error) {
          console.error('Erreur lors de la récupération des posts:', error);
        } finally {
          isLoadingMore.value = false;
          loading = false;

        }
      };

      const moreFavorites = async () => {
        loading = true;
        if (isLoadingMore.value) return;
        if (pagination.value.page >= pagination.value.pages) return; // plus de pages

        isLoadingMore.value = true;
        pagination.value.page++;

        try {
          const postsServiceItems = await postService.getFavorites(pagination.value.limit, pagination.value.page);
          postsServiceItems.products.forEach((post: any) => {
            posts.value.push(post);
          });
          pagination.value.pages = postsServiceItems.pagination.pages;
        } catch (error) {
          console.error('Erreur lors de la récupération des posts:', error);
        } finally {
          isLoadingMore.value = false;
          loading = false;

        }

      };
      const loadMore = async () => {
        // Access event from props instead of this.event
        if (props.event === 'morePage') {
          loadMoreData(); // Affiche la popup si l'événement est 'add'
        } else if (props.event === 'morePageFavorites') {
          moreFavorites();
        }
      }

      // Setup infinite scroll
      useInfiniteScroll(
        scrollContainer,

        loadMore,
        {
          distance: 200,
          direction: 'bottom',
          canLoadMore: () => {
            if(pagination.value.pages == pagination.value.page){
              return false;
            }
            return true
          },

        },

      );

      return { route, router, scrollContainer, isLoadingMore, pagination, loadMore, posts, loading,moreFavorites };
    },
    props:{
      query: {
        type: String,
        required: false,
      },
      event: {
        type: String,
        required: false,
      },
    },

    data() {
      return {
        queryLocal:'',
        isMobile: window.innerWidth <= 769,
        // `posts` et `pagination` sont fournis par setup(), qui a la priorité sur
        // data() : les redéclarer ici créait une collision de noms sans effet
        // (les valeurs de data() n'étaient jamais lues). Source unique : setup().
        filters: {
          min: null,
          max: null,
          conditions: null,
          type: null,
          group: null,
          member: null
        } as SearchFilters,
        isPopupVisible: false
      };

    },
    mounted() {
      window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.handleResize);
    },
    created() {
      this.loadSearchInformation();
    },
      watch: {
        route: {
          immediate: false,
          handler() {
            this.loadSearchInformation();
          }
        }
      },
    methods: {
      loadSearchInformation(){
        // Don't show internal event names in search bar
        const internalEvents = ['morePage', 'morePageFavorites', 'moreFavorites', 'search'];
        this.queryLocal = (this.query && !internalEvents.includes(this.query)) ? this.query : '';
        if(this.event && this.event !== ''){
          if(this.event === 'morePage') {
            this.loadMore();
          }else if(this.event === 'morePageFavorites') {
            this.moreFavorites();
          }
          else if(this.event === 'search'){
            this.searchEvent(this.queryLocal)
          }
        } else {
          // Par défaut, charger tous les articles
          this.runSearch();
        }
      },
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      handleResize() {
        this.isMobile = window.innerWidth <= 769;
      },
      buildAdvancedPayload() {
        const payload: any = {
          page: 1,
          limit: this.pagination.limit || 500,
          sortBy: 'relevance',
        };
        if (this.queryLocal) payload.query = this.queryLocal;
        if (this.filters.type) payload.type = this.filters.type;
        if (this.filters.conditions && Array.isArray(this.filters.conditions) && this.filters.conditions.length) {
          payload.condition = this.filters.conditions;
        }
        if (this.filters.group) {
          payload.groups = [this.filters.group];
        }
        if (this.filters.member) {
          payload.members = [this.filters.member];
        }
        const min = this.filters.min !== null && this.filters.min !== undefined ? Number(this.filters.min) : undefined;
        const max = this.filters.max !== null && this.filters.max !== undefined ? Number(this.filters.max) : undefined;
        if (min !== undefined || max !== undefined) {
          payload.priceRange = { ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
        }
        return payload;
      },
      async runSearch() {
        try {
          const result = await searchService.advancedSearch(this.buildAdvancedPayload());
          this.posts = result.products || [];
          this.pagination = result.pagination || { limit: 500, page: 1, pages: 1 };
        } catch (error) {
          console.error('Erreur lors de la recherche avancée :', error);
          postService.search(this.queryLocal, this.filters.max, this.filters.min, this.filters.type)
            .then((res) => { this.posts = res.products; this.pagination = res.pagination; })
            .catch((e) => console.error('Erreur fallback :', e));
        }
      },
      async loadMoreResults() {
        try {
          this.pagination.page++;
          const payload = this.buildAdvancedPayload();
          payload.page = this.pagination.page;
          const result = await searchService.advancedSearch(payload);
          this.posts.push(...(result.products || []));
          this.pagination.pages = result.pagination?.pages || this.pagination.pages;
        } catch (error) {
          console.error('Erreur chargement supplémentaire:', error);
          this.pagination.page--;
        }
      },
      applyFilter(valFilters: SearchFilters){
        this.filters = valFilters;
        this.runSearch();
      },
      searchEvent(query: string){
        if(this.queryLocal != query){
          this.queryLocal = query;
          const combined = this.$func.buildCombinedSlug(this.queryLocal, 'search');

          this.router.push({
              name: 'searchList',
              params: { combined }
          });
        }
        this.runSearch();
      }

    },
  })
  </script>

  <style scoped lang="scss">
  @use '../../css/searchList.scss' as *;

  .load-more-wrap {
    display: flex;
    justify-content: center;
    padding: 24px 0;
  }
  .load-more-btn {
    padding: 12px 32px;
    background: var(--surface-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: var(--surface-hover);
      transform: translateY(-1px);
    }
  }
  </style>
