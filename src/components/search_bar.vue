<template>
  <div class="search-bar-container">
    <input
      v-model="searchQuery"
      @keyup.enter="onSearch"
      type="text"
      class="search-input"
      placeholder="Rechercher un produit ..."
    />
    <button class="search-btn" @click="onSearch">
      <i class="bi bi-search"></i>
      Rechercher
    </button>
  </div>

</template>
  
  <script lang="ts">
    import axios from 'axios';
    import Cookies from "js-cookie";
    import postService from '@/services/post.js';
    import { useRoute, useRouter } from "vue-router";
    //import eventBus from '/eventBus'

    export default {

        name: "search_bar",
        components: {
        },
        props: {

        },
        data() {
            return {
                searchQuery: '',
                showLoader: false,
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
  
  <style lang="scss" scoped>
    .card{
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        height: 300px;
        position: relative;
    }
    .review_card_content_header{
        display: flex;
    }
    .reviewer_username{
        vertical-align: middle;
        margin-left: 10px;
    }
    .reviewer_rating{

    }
    .inputReason{
        width: calc(98% - 2px);
        margin-left: 1%;
        margin-right: 1%;
        border: 2px solid var(--secondary-color-tint);
        border-radius: 4px;
    }
    .review_card_content_header_content{
        margin-top: 10px;
    }
    .dropdown-menu{
        display: block;
    }

    .review_card_content{
        height: 100%;
        width: 50%;
        flex-direction: column; 
        display: flex;
        justify-content: space-between;
        overflow-x: scroll;
        position: relative;
    }

    .review_card_content_text{
        margin-top: 10px;
        margin-left: 10px;
        height: 100%; // ou une hauteur explicite si besoin
        display: flex;
        flex-direction: column;
    }
    .review_text{
        font-size: small;
        padding-bottom: 15px;
        max-height: 60%; // ou la valeur que tu veux
        overflow-y: auto;
        word-break: break-word;
        padding-right: 3px;
    }
    .review_text::-webkit-scrollbar {
        width: 8px;
        background: #eee;
    }
    .review_text::-webkit-scrollbar-thumb {
        background: #bdbdbd;
        border-radius: 4px;
    }
    .illustration{
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 50%;
        align-items: center;
        justify-content: center;
        background: black;
        position: relative;
        margin: 10px;
        border-radius: 5px;
    }
    .picture_profile_review{
        height: 80px;
        width: 80px;
        margin-left: 10px;
        margin-top: 10px;
        background-color: var(--primary-color);
    }
    .picture_profile_review img{
        width: 100%;
    }
    @media (max-width:980px){
        .container_detail_card .card{
            flex-direction: column-reverse;
        }
    }
    @media (max-width:820px){
        .review_card_content{
            width: 100%;
        }
        .illustration{
            width: 100%;
            height: 50%;
        }
        .container_detail_card{
            height: 90%;
        }
    }
    @media (max-width:550px){
        .container_detail_card .card {
            overflow-y: scroll;
            display: flex;
            flex-wrap: nowrap; 
            white-space: nowrap; 
            width: 100%;    
        }
    }

    .search-bar-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20px 0;
    }

    .search-input {
      padding: 10px;
      font-size: 16px;
      border: 2px solid var(--secondary-color-tint);
      border-radius: 4px;
      width: 300px;
      margin-right: 5px;
    }

    .search-btn {
      background-color: var(--primary-color);
      border: none;
      border-radius: 4px;
      padding: 10px 15px;
      cursor: pointer;
      color: white;
      font-size: 16px;
    }

    .search-btn i {
      margin-right: 5px;
    }
  </style>
