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
          <div v-if="productFavorites.products.length > 0" class="container titleCateg">Tes favoris</div>
          <Grid :pagination="productFavorites.pagination" :dataList="productFavorites.products"></Grid>
          <!-- Grid annonce autre -->
          <div class="container titleCateg">Recommandé pour toi</div>
          <Grid  :pagination="paginationTab" :dataList="dataCardList"></Grid>
        </div>


    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';


    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import search_bar from '@/components/search_bar.vue';
    import row_products from '@/components/row_products.vue';
    import postService from '../../services/post';
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
        this.getPosts(12);
        this.getFav();
        /*postService.getRecommendations().then((products) => {
          console.log(products);
          this.productRecommendations = products;
        })*/
      });
     

    },
    created() {


    },
    setup() {
      return {
          
      };
    },
    data(): { 
      isPopupVisible: boolean; 
      dataCardList: any[],
      paginationTab: any[],
      productRecommendations: any[],
      productFavorites: { pagination: any[]; products: any[]; }
    } {
      return {
        isPopupVisible: false, 
        productRecommendations: [], 
        dataCardList: [],
        paginationTab: [],
        productFavorites: { pagination: [], products: [] },
      };
    },
    methods: {
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
      getRecommendations(){

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
        const PHPSESSID = Cookies.get('PHPSESSID');
        const API_URL = import.meta.env.VITE_API_URL;
        axios.get(`${API_URL}/api/products/inventory/favorites/`, {
          headers: {
            Authorization: `Bearer ${PHPSESSID}`,
            "Content-Type": "application/json"
          }
        }).then((response) => {
          sessionStorage.removeItem('favorites');
          this.productFavorites = response.data;
          sessionStorage.setItem('favorites', JSON.stringify(this.productFavorites));
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
  