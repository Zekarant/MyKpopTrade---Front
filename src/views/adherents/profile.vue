<template>
    <main >
        <Nav_bar></Nav_bar>        
        <div class="row row_profil_content">
            <div class="col-0 col-xs-0 col-md-0 col-lg-2 "></div>
            <div class="col-12 col-xs-12 col-md-12 col-lg-8 ">
              <div class="row row-banner">
                <banner></banner>     
              </div>
              <div class="row">
                <segment_profil @partDisplayed="changePart"></segment_profil>  
              </div>
              <br>
              <Grid style="width: 100%;" v-if="partView === 'post'" :dataList="dataCardList"></Grid>

            </div>
            <div class="col-0 col-xs-0 col-md-0 col-lg-2"></div>
        </div>


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

  export default defineComponent({
    name: 'profile',
    components: {
        Nav_bar,
        banner,
        segment_profil,
        Grid
    },
    mounted() {
      this.verifSession();

    },
    setup() {
        const partView = ref('post');
        const route = useRoute();
        const id = route.params.id; // Récupère l'ID passé en paramètre

        function changePart(part: string) {
          partView.value = part;
        }
        const dataCardList = ref([
        {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,
                state: 'Neuf'

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,
                state: 'Bon état'

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,
                state: 'Bon état'

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,
                state: 'Bon état'
            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,
                state: 'Bon état'

            },
        ]);
        return {
            dataCardList,
            partView,
            changePart,
            route,
            id
        };
    },
    methods: {
      verifSession(){
        console.log("fonction pour vérifier si le token est le même que le token enregistré");
        const PHPSESSID = Cookies.get('PHPSESSID');
        console.log(PHPSESSID);
        if(!PHPSESSID){
          this.$func.logout();
        }
      }
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
  