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

  <style scoped lang="scss">
  @use '../css/search_bar.scss' as *;
  </style>
  