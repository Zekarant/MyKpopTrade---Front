<template>
    <main>
        <Nav_bar  @toggle-popup-add="showPopup"></Nav_bar>        
        <popup_add_item v-if="isPopupVisible" @close="isPopupVisible=false"></popup_add_item>
        <div>
          <!-- Search bar -->
        </div>
        <div class="img-banner-container">
          <img src="../../assets/images/banner_home.png" alt="Banner" class="img-banner">
          <search_bar style="z-index: 9; position: absolute; top: 0px; margin-left: auto; margin-right: auto;  width: 100%; margin-top: auto; margin-bottom: auto; height: 100%;"></search_bar>
        </div>
        <div>
          <!-- Grid annonce Favoris -->
          <div v-if="productFavorites.products && productFavorites.products.length > 0" class="container titleCateg">Tes favoris</div>
          <row_products @voirPlus="loadMore" :moreBtn="true" :pagination="productFavorites.pagination" :dataList="productFavorites.products"></row_products>
          <!-- Grid annonce autre -->
          <div v-if="productRecommendations.length > 0" class="container titleCateg">Recommandé pour toi</div>
          <Grid :moreBtn="true" :pagination="paginationTab" :dataList="productRecommendations"></Grid>
            <!-- Grid annonce autre -->
          <div v-if="dataCardList && dataCardList.length > 0"  class="container titleCateg">Fil d'actu</div>
          <Grid :moreBtn="true" :pagination="paginationTab" :dataList="dataCardList"></Grid>
        </div>


    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useRouter } from "vue-router";

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar from '@/components/search_bar.vue';
    import row_products from '@/components/row_products.vue';
    import postService from '../../services/post.service';
    import Cookies from "js-cookie";
    import axios from "axios";

  export default defineComponent({
    name: 'dashboard',
    components: {
      Nav_bar,
      Popup_add_item,
      search_bar,
      row_products

    },
    mounted() {
      this.$func.verifSession().then(() => {
        this.getFav();
        this.getRecommendations();
        this.getPosts(12);

      });
     

    },
    created() {


    },
    setup() {
      const router = useRouter();

      return {
          router
      };
    },
    data(): { 
      isPopupVisible: boolean; 
      dataCardList: any[],
      paginationTab: any,
      productRecommendations: any[],
      productFavorites: { pagination: any; products: any[]; }
    } {
      return {
        isPopupVisible: false, 
        productRecommendations: [], 
        dataCardList: [],
        paginationTab: {},
        productFavorites: { pagination: {}, products: [] },
      };
    },
    methods: {
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      async getRecommendations(){
        const products = await postService.getRecommendations();
        console.log('productRecommendations', products);

        this.productRecommendations = products;
        console.log('productRecommendations', this.productRecommendations);
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
          console.log('posts', posts);
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
      }
    },
  })
  </script>
  
<style lang="scss" scoped>
.img-banner-container {
  width: 100vw;
  height: 45vh; 
  max-width: 100%;
  overflow: hidden;
  position: relative;
  margin-left: 50%;
  transform: translateX(-50%);
}

.img-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
.titleCateg{
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: larger;
  font-weight: bold;
  align-items: center;
  justify-self: center;
  max-width: 990px;
  width: 100%;
}

</style>
  