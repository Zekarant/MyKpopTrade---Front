<template>
    <main>
        <Nav_bar  @toggle-popup-add="showPopup"></Nav_bar>        
        <popup_add_item v-if="isPopupVisible" @close="isPopupVisible=false"></popup_add_item>

        <div>
          <message_list></message_list>
        </div>
    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useRouter } from "vue-router";

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import message_list from '@/components/adherents/message_list.vue';
    import authentification from '@/services/authentification.service';

    import Cookies from "js-cookie";
    import axios from "axios";

  export default defineComponent({
    name: 'messaging',
    components: {
      Nav_bar,
      Popup_add_item,
      message_list,


    },
    mounted() {
      authentification.verifSession().then(() => {


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
    } {
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
  