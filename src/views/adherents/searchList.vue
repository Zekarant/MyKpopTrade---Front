<template>
    <main>
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
              <span class="result_title">Résultat de la recherche <span v-if="queryLocal"> : {{ queryLocal }}</span></span>
              <div v-if="isMobile" class="filter_content">
                <filter_list @saveFilter="applyFilter"></filter_list>
              </div>
            </div>
            <br>
            <Grid :dataList="posts"></Grid>
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
    
    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar_2 from '@/components/search_bar_2.vue';
    import filter_list from '@/components/filter_list.vue';

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
      
      var loading = false;
      const posts = ref<any[]>([]);

      // Fonction pour charger plus



      const loadMoreData = async () => {
        console.log('more');
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
        console.log('more favorites');

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
        posts: [] as any[],
        pagination: {
          limit: 10,
          page: 1,
          pages: 1
        },
        filters: {
          min: null,
          max: null,
          conditions: null,
          type: null
        },
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
        const postsStr = sessionStorage.getItem('posts_str') || '[]';
        const pagination_str = sessionStorage.getItem('pagination_str') || '[]';
        this.queryLocal = this.query ?? '';
        if(this.event !=''){
          console.log('event', this.event);
          if(this.event === 'morePage') {
            this.loadMore(); // Affiche la popup si l'événement est 'add'
          }else if(this.event === 'morePageFavorites') {
            this.moreFavorites();
          }
          else if(this.event === 'search'){
            this.searchEvent(this.queryLocal)
          }
        }

        this.posts = JSON.parse(postsStr as string);
        this.pagination = JSON.parse(pagination_str as string);
      },
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      handleResize() {
        this.isMobile = window.innerWidth <= 769;
      },
      applyFilter(valFilters: any){
        this.filters = valFilters;
        postService.search(this.queryLocal, this.filters.max,this.filters.min,this.filters.type).then((postsServiceItems) => {
          this.posts = postsServiceItems.products;
          this.pagination = postsServiceItems.pagination;
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
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

        
        postService.search(this.queryLocal, this.filters.max,this.filters.min,this.filters.type).then((postsServiceItems) => {
          this.posts = postsServiceItems.products;
          this.pagination = postsServiceItems.pagination;
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      }
   
    },
  })
  </script>
  
  <style scoped lang="scss">
  @use '../../css/searchList.scss' as *;
  </style>
  