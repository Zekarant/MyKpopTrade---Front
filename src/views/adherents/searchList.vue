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
          <div class="content_grid">
            <search_bar_2 :query="query" :filters="filters" @search="searchEvent" class="search_bar_content"></search_bar_2>
            <div style="font-weight: bold; font-size: 20px;margin-left: 24px;">
              <span class="result_title">Résultat de la recherche</span>
              <div v-if="isMobile" class="filter_content">
                <filter_list @saveFilter="applyFilter"></filter_list>
              </div>
            </div>
            <br>
            <Grid :dataList="posts"></Grid>
          </div>
          <div style="width: 5%;"></div>

        </div>



    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import postService from '../../services/post.js';

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar_2 from '@/components/search_bar_2.vue';
    import filter_list from '@/components/filter_list.vue';
    import router from '@/router/index.js';
    

  export default defineComponent({
    name: 'searchList',
    components: {
      Nav_bar,
      Popup_add_item,
      search_bar_2,
      filter_list
    },
    props: {

    },
    data() {
      return {
        query: '',
        isMobile: window.innerWidth <= 769,
        posts: [] as Array<{
          condition: any;
          isAvailable: any;
          id: number;
          title: string;
          state: string;
          price: number;
          isReserved: boolean;
          images: string[];
        }>,
        pagination: {
          limit: 10,
          page: 1
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
      const route = useRoute();
      const postsStr = sessionStorage.getItem('posts_str') || '[]';
      const pagination_str = sessionStorage.getItem('pagination_str') || '[]';
      
      const event = route.query.event || '';
      if(event !=''){
        if(event === 'morePage') {
          this.loadMore(); // Affiche la popup si l'événement est 'add'
        }else if(event === 'search' && route.query.query){
          this.query = Array.isArray(route.query.query) ? route.query.query[0] || '' : (route.query.query || '');
          console.log('route.query',this.query);
          this.searchEvent(this.query)
        }
      }

      this.posts = JSON.parse(postsStr as string);
      this.pagination = JSON.parse(pagination_str as string);
    },
    methods: {
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      handleResize() {
        this.isMobile = window.innerWidth <= 769;
      },
      loadMore(){
        this.pagination.page++;
        postService.getPosts(this.pagination.limit, this.pagination.page).then((postsServiceItems) => {
          postsServiceItems.products.forEach((postsServiceItem: { condition: any; isAvailable: any; id: number; title: string; state: string; price: number; isReserved: boolean; images: string[]; }) => {
            this.posts.push(postsServiceItem);
          });
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      },
      applyFilter(valFilters: any){
        this.filters = valFilters;
        postService.search(this.query, this.filters.max,this.filters.min,this.filters.type).then((postsServiceItems) => {
          this.posts = postsServiceItems.products;
          this.pagination = postsServiceItems.pagination;
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      },
      searchEvent(query: string){
        this.query = query;
        const route = useRoute();

        // Pour Met à jour l'URL sans recharger la page (pour éviter les problème si on recharge la page)
        router.push({
          name: 'searchList',
          query: {
            query: this.query
          }
        });
        postService.search(query, this.filters.max,this.filters.min,this.filters.type).then((postsServiceItems) => {
          this.posts = postsServiceItems.products;
          this.pagination = postsServiceItems.pagination;
        }).catch((error) => {
          console.error('Erreur lors de la récupération des posts:', error);
        });
      }
   
    },
  })
  </script>
  
<style lang="scss" scoped>
.content{
  display: flex;
}
.content_grid{
  width: 70%;
}
.search_bar_content{
  width: 100%;
  margin-left: 24px; 
  margin-right: 24px 
}
.filter_content{
  width: 20%; 
  height: 100%;
}
@media (max-width: 769px) {
  .search_bar_content{
    width: 90%;
  }
  .content{
    flex-direction: column;
  }
  .content_grid{
    width: 100%;
  }
  .filter_content{
    margin-left: auto;
    width: auto;
    display: inline-block;
  }
  .result_title{
    display: inline-block;
    width: 85%;
  }
}
</style>
  