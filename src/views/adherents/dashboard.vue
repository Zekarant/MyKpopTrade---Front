<template>
    <main>
        <Nav_bar  @toggle-popup-add="showPopup"></Nav_bar>        
        <popup_add_item v-if="isPopupVisible" @close="isPopupVisible=false"></popup_add_item>

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';


  export default defineComponent({
    name: 'dashboard',
    components: {
      Nav_bar,
      Popup_add_item
    },
    mounted() {
    },
    setup() {
      return {
          
      };
    },
    data() {
      return {
        isPopupVisible: false, 
      };
    },
    methods: {
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
    },
  })
  </script>
  
<style lang="scss" scoped>
 
</style>
  