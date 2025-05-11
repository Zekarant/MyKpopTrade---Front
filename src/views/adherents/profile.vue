<template>
    <main >
        <Nav_bar @toggle-popup-add="showPopup"></Nav_bar>        
        <div class="row row_profil_content">
            <div class="col-0 col-xs-0 col-md-0 col-lg-2 "></div>
            <div class="col-12 col-xs-12 col-md-12 col-lg-8 ">
              <div class="row row-banner">
                <banner :profilInfo="profilInfo" :admin="myProfile"></banner>     
              </div>
              <segment_profil @partDisplayed="changePart"></segment_profil>  

              <br>
              <Grid style="width: 100%;" v-if="partView === 'post'" :admin="myProfile" :dataUser="profilInfo" :dataList="dataCardList"></Grid>
              <div style="width: 100%;" v-if="partView === 'about'">
                
              </div>
            </div>
            <div class="col-0 col-xs-0 col-md-0 col-lg-2"></div>
        </div>

        <popup_add_item v-if="isPopupVisible" @close="isPopupVisible=false"></popup_add_item>

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import banner from '@/components/adherents/banner.vue';
    import segment_profil from '@/components/adherents/segment_profil.vue';
    import Grid from '@/components/grid.vue';
    import Cookies from "js-cookie";
    import { useRoute } from "vue-router";
    import axios from 'axios';
    import Popup_add_item from '@/components/popup_add_item.vue';

  export default defineComponent({
    name: 'profile',
    components: {
        Nav_bar,
        banner,
        segment_profil,
        Grid,
        Popup_add_item
    },
    mounted() {
      this.verifSession();
      this.getInfoProfil();
      this.getInventory();
    },
    setup() {
        const partView = ref('post');
        const route = useRoute();
        const id = route.params.id; // Récupère l'ID passé en paramètre
        const myProfile = ref(false); 

        function changePart(part: string) {
          partView.value = part;
        }
        if (id === 'me') {
            myProfile.value = true;
        }
        var profilInfo = ref([])
        const dataCardList = ref([]);
        return {
          dataCardList,
          profilInfo,
          partView,
          changePart,
          route,
          id,
          myProfile
        };
    },
    data() {
      return {
        isPopupVisible: false, 
      };
    },
    methods: {
      verifSession(){
        const PHPSESSID = Cookies.get('PHPSESSID');
        console.log(PHPSESSID);
        if(!PHPSESSID){
          this.$func.logout();
        }
      },
      async getInfoProfil(){
        const PHPSESSID = Cookies.get('PHPSESSID');
        await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${PHPSESSID}` // Ajout du Bearer Token

            }
          }).then(response => {

          if (response.status === 200) {
            this.profilInfo = response.data.user;
          }
          }).catch(error => {
            if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
              this.$func.logout();
            }
            console.log(error);
          });

  
      },
      async getInventory(){
        const PHPSESSID = Cookies.get('PHPSESSID');
        ///api/products/inventory/me?status=available
        await axios.get(`${import.meta.env.VITE_API_URL}/api/products/inventory/me`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PHPSESSID}` // Ajout du Bearer Token

          }
        }).then(response => {
          if (response.status === 200) {
            this.dataCardList = response.data.products;

          }
        }).catch(error => {
          if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
            this.$func.logout();
          }
        });
      },
      showPopup() {
        this.isPopupVisible = true; // Affiche la popup
      },
    },
  })
  </script>
  
<style lang="scss" scoped>
 .row-banner{
    height: 30vh;
 }
 @media (max-width: 769px) {
  .row-banner{
    height: auto;
  }
  .row_profil_content{
    width: 100vw;
  }
 }
 @media only screen and (max-width: 1024px) {
    .col-lg-8{
        width: 100% !important;
    }
    .col-lg-2{
        width: 100% !important;
    }
}
</style>
  