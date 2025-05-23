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
              <div class="row" style="width: 100%;" v-if="partView === 'about'">
                <div class="col-xs-0 col-md-0 col-lg-2"></div>
                <div class="col-xs-12 col-md-12 col-lg-8">
                  <div  v-if="!myProfile"  class="description_user">
                    <span class="title_description">Description</span>
                    <br>
                    <span v-if="profilInfo.bio && !myProfile" class="description_value">{{ profilInfo.bio }}</span>
                  </div>
                  <textarea v-model="profilInfo.bio" @change="info_update()" v-if="myProfile" class="description_value">{{ profilInfo.bio }}</textarea>
                  <br>
                  <div style="display: block;margin-left: auto; margin-right: auto;">
                    <div class="grid_info">
                      <div class="col-6 col-6 col-xs-6 col-md-6  label_info">
                        <div class="name_label"></div>
                        <div class="name_user_label">Nom d'utilisateur</div>
                        <div class="birthday_label"></div>
                        <div class="country_residence_label" v-if="profilInfo.location">Lieux de résidence</div>
                      </div>
                      <div class="col-6 col-xs-6 col-md-6 col-lg-2 info_user">
                        <div class="name_value"></div>
                        <div class="name_user_value">{{ profilInfo.username }}</div>
                        <div class="birthday_value"></div>
                        <div class="country_residence_value" v-if="profilInfo.location && !myProfile">{{ profilInfo.location }}</div>
                        <div class="country_residence_value" v-if="myProfile"><input style="border: none;" :value="profilInfo.location" v-model="profilInfo.location"></div>
                      </div>
                    </div>
                  </div>

                  <br>
                  <div v-if="profilInfo.createdAt" class="row dateCreated">
                    <span>Compte créer le {{ memberSinceFormatted }}</span>
                  </div>
                  <br>
                  <div v-if="profilInfo.isSellerVerified" class="certif">
                    <img src="@/assets/images/certif.svg">
                    <div style="display: block; margin-top: 5px;" class="centerContent">
                    <div style="display: inline-block; width: fit-content;">Ce compte est certifié.</div><div style="display: inline-block; width: fit-content; margin-left: 5px; "><a style="color: var(--blue); text-decoration: none;" href="#"> En savoir plus</a></div>
                    <br>
                    <!--<div style="display: inline-block;">Compte certifié depuis Mois Année.</div>--->
                  </div>
                  <br>
                  <button class="btnSave btn btn-primary" v-if="isBtnSaveVisible" @click="saveProfile">Enregistrer</button>                  </div>
    
                </div>

                <div class="col-xs-0 col-md-0 col-lg-2"></div>

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
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';

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
    computed: {
      memberSinceFormatted() {
        if (!this.profilInfo.createdAt) return '';
        const date = new Date(this.profilInfo.createdAt);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
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
        var profilInfo = ref({} as { username?: string; [key: string]: any })
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
        isBtnSaveVisible: false, 
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
      info_update(){
        console.log('update');
        this.isBtnSaveVisible = true;
      },
      async saveProfile() {
        const PHPSESSID = Cookies.get('PHPSESSID');
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/profiles/me`,
            {
              bio: this.profilInfo.bio,
              location: this.profilInfo.location
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PHPSESSID}`
              }
            }
          );
          this.isBtnSaveVisible = false; // Cache le bouton après sauvegarde
          // Optionnel : afficher un message de succès
        } catch (error) {
          // Optionnel : afficher un message d'erreur
          console.error(error);
        }
      }
    },
  })
  </script>
  
<style lang="scss" scoped>
 .row-banner{
    height: 30vh;
 }
 .description_user{
    border: 1px solid var(--secondary-color-tint);
    padding: 10px;
  }
  .title_description{
    font-size: small;
  }
  .description_value{
    font-size: small;
    color: var(--secondary-color);
  }
  textarea.description_value{
    border: 1px solid var(--secondary-color-tint);
    width: 50%;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  
  .label_info{
    text-align: right;
    color: var(--secondary-color);
    font-size: smaller;
  }
  .info_user{
    text-align: left;
    font-size: smaller;

  }
  .certif{
    text-align: center;
    font-size: smaller;
  }
  .certif img{
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .btnSave{
    width: 50%;
    font-size: smaller;
  }
  .grid_info{
    display: flex;
    flex-direction: row;
  }
  .dateCreated{
    text-align: center; 
    font-size: smaller;
  }
  .grid_info .info_user, .grid_info .label_info{
    margin-left: 8px;
    margin-right: 8px;
    width: 50%;
  }
@media (max-width: 769px) {
  .row-banner{
    height: auto;
  }
  .row_profil_content{
    width: 100vw;
  }
  textarea.description_value{
    width: 90%;
    display: block;
    margin-left: 7%;
    margin-right: 5%;
  }
  .description_value, .grid_info, .certif, .dateCreated, .info_user, .label_info{
    font-size: medium;
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
  