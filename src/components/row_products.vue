<template>
   <div style="display: flex; align-items: center;">
  <div class="container" ref="scrollContainer">
    <swiper  
        class="custom-swiper-nav"
        :navigation="{
            nextEl: '.custom-swiper-next',
            prevEl: '.custom-swiper-prev'
        }"
        :modules="modules"
        :slides-per-view="4"
        :space-between="20"
        :breakpoints="{
            0: { slidesPerView: 1 },
            720: { slidesPerView: 2 },
            980: { slidesPerView: 4 }
        }"
                v-if="dataList && dataList.length > 0">
        <swiper-slide v-for="(data, index) in dataList" :key="index">
            <card
                :data="data"
                v-on:click="openPostInfo(index)"
                :key="index"
            ></card>
        </swiper-slide>
        <div class="custom-swiper-prev">      
            <i class="bi bi-chevron-left chevron-bold"></i>        
        </div>
        <div class="custom-swiper-next">
            <i class="bi bi-chevron-right chevron-bold"></i>        
        </div>
        <swiper-slide v-if="pagination.page < pagination.pages " class="voir-plus-slide">
            <button class="voir-plus-btn" @click="onVoirPlus">Voir plus</button>
        </swiper-slide>
    </swiper>


  </div>
</div>
    <div v-if="stateCardPost" class="post-overlay" @click.self="closePost" >
        <post @closePost="closePost" :idPost="dataCardPost._id" :dataPost="dataCardPost" />
    </div>
</template>
  

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import axios from 'axios';
    import card_illu from '../components/card_illu.vue';
    import post from '../components/post.vue';
    import card from '../components/card.vue';
    import { Navigation, A11y } from 'swiper/modules';

    // Import Swiper Vue.js components
    import { Swiper, SwiperSlide } from 'swiper/vue';

    // Import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';
    
    export default defineComponent({
        name: "row_products",
        components: {
            card_illu,
            post,
            card,
            Swiper,
            SwiperSlide,
        },
        
        props: {
            dataList: {
                type: Array as () => Array<Record<string, any>>,
                required: true, // au lieu de true
                default: () => []
            },
            pagination: {
                type: Object,
                required: false,
                default: () => ({
                    limit: 1,
                    page: 1,
                    pages: 1,
                    total: 10,
                }),
            },
            moreBtn: {
                type: Boolean,
                default: false
            }
        },
        emits: ['voirPlus'], 
        
        data() {
          return {

          };
        },
        setup() {
            var dataCardPost: any = null;
            var stateCardPost = ref(false);
            const onSwiper = (swiper: any) => {
                console.log(swiper);
            };
            const onSlideChange = () => {
                console.log('slide change');
            };
            return {
                dataCardPost,
                stateCardPost,
                onSwiper,
                onSlideChange,
                modules: [Navigation, A11y],

            };
        },
        methods: {
            openPostInfo(index: number) {
                if(this.stateCardPost){
                    this.stateCardPost = false;
                    this.dataCardPost = this.dataList[index];
                    this.stateCardPost = true;
                }else{
                    this.dataCardPost = this.dataList[index];
                    this.stateCardPost = true;
                }
              
            },
            onVoirPlus() {
                // Action à faire (navigation, popup, etc.)
                this.$emit('voirPlus', { products: this.dataList, pagination: this.pagination, type: 'PageFavorites' });
            },
            closePost() {
                this.stateCardPost = false;
            },
         



        },
    
        mounted() {

        },
    });

  </script>
  
  <style lang="scss" scoped>

    .card{
        width: 220px;    
    }
    .banner_reserved{
        background: var(--danger-color);
        width: 100%;
        position: absolute;
        top: 0;
        z-index: 9;
    }
    .banner_draft{
        background: var( --secondary-color-shade);
        width: 100%;
        position: absolute;
        top: 0;
        z-index: 9;
    }
    .banner_reserved .state_reserved,  .banner_draft .state_draft{
        color: white;
        font-size: smaller;
        font-weight: bold;
        text-align: center;
    }
    .container {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        align-items: center;
        max-width: 990px;
        width: 100% !important;
        gap: 1rem;
        padding-bottom: 8px;
        scrollbar-width: thin;    // Scrollbar fine sur Firefox
    }
    .swiper{
        width: 100%;
    }
    /* Pour un meilleur rendu sur Chrome */
    .container::-webkit-scrollbar {
        height: 8px;
    }
    .container::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }

    /* Optionnel : largeur minimale pour chaque carte */
    .container > * {
        min-width: 220px;
    }
    .post-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5); /* Fond noir transparent */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* Assurez-vous que le composant est au-dessus des autres éléments */
    }

    .post-overlay post {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
    }
    .bi-chevron-right, .bi-chevron-left {
    // Pour certains navigateurs, tu peux essayer :
        filter: drop-shadow(0 0 0 black) drop-shadow(0 0 0 black);
    }
    .voir-plus-slide {
        display: flex !important;
        align-items: center;
        justify-content: center;
        min-width: 110px !important; /* moitié de 220px */
        max-width: 110px !important;
        padding: 0;
        height: 100%;

    }

    .voir-plus-btn {
        width: 100%;
        height: 100%;
        background: var(--primary-color, #819A57);
        color: #fff;
        border: none;
        border-radius: 12px;
        font-size: 1.1em;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 280px;
        
    }
    .voir-plus-btn:hover {
        background: #fff;
        border: solid 2px var(--primary-color);
        color: var(--primary-color);
    }
    @media (max-width:980px){
    .container{
        grid-template: auto / repeat(auto, 1fr)
    }
    }
    @media (max-width:720px){
        .container{
            grid-template: auto / repeat(2, 1fr);
            width: 96vw;
            margin-right: 0px;
            padding-right: 0px;
            margin-left: 0px;
            padding-left: 0px;
        }
    }
    @media (max-width:550px){
        .container{
            grid-template: auto / repeat(1, 1fr)
        }
    }


  </style>
<style lang="scss">
.custom-swiper-nav .custom-swiper-next,
.custom-swiper-nav .custom-swiper-prev {
  position: absolute;
  top: 40%;
  z-index: 10;
  width: 45px;
  height: 45px;
  background: #ffffff;
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items:center;
  justify-content: center;
  font-size: 1.5em;
  font-weight: bold;
  cursor: pointer;
  transform: translateY(-50%);
  opacity: 0.9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: background 0.2s;
  user-select: none;
  line-height: 1;
}
.custom-swiper-nav .custom-swiper-prev { left: 10px; text-align: center; vertical-align:sub}
.custom-swiper-nav .custom-swiper-next { right: 10px; text-align: center; vertical-align: sub; }
.custom-swiper-nav .custom-swiper-next.swiper-button-disabled,
.custom-swiper-nav .custom-swiper-prev.swiper-button-disabled {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.2s;
}
</style>
