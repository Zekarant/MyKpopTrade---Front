<template>
<div class="search-bar-wrapper">
  <span class="search-icon">
    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
    </svg>
  </span>
  <input type="text" class="search-input" placeholder="Rechercher un produit ..." v-model="searchQuery" @keyup.enter="search">
  <button v-if="searchQuery != ''" class="clear-button" @click="searchQuery = '';search()">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
  </button>
</div>

</template>
  
  <script lang="ts">

    export default {

        name: "search_bar_2",
        components: {
        },
        props: {
          query: {
            type: String,
            default: ''
          },
          filters: {
            type: Object,
            default: () => ({
              min: null,
              max: null,
              conditions: null,
              type: null
            })
          }
        },
        data() {
            return {
              searchQuery: '',
              showLoader: false
            };
        },
        mounted(){
          console.log('query :',this.query);
          if(this.query != ''){
            this.searchQuery = this.query;
          }
        },
        methods: {
          search() {
            this.$emit('search', this.searchQuery);
          },
        }
    }

  </script>
  
  <style lang="scss" scoped>
.search-bar-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--light-color); /* Couleur fond input */
  border-radius: 8px;
  padding: 12px 12px;
  max-width: 990px;
  height: 48px;
  align-items: center;
  justify-self: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
}

.search-icon {
  color: #6c757d; /* Gris icône */
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #121212; /* Couleur texte */
}

.clear-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 18px;
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.clear-button:hover {
  color: #212529; /* Un peu plus foncé au hover */
}

  </style>
