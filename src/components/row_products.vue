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
                @click="openPostInfo(index)"
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
    <Teleport to="body">
      <div v-if="stateCardPost" class="post-overlay" @click.self="closePost" >
          <post :key="dataCardPost?._id" @closePost="closePost" :idPost="dataCardPost?._id" />
      </div>
    </Teleport>
</template>


<script lang="ts">
    import { defineComponent, ref, nextTick } from 'vue';
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
            const dataCardPost = ref<any>(null);
            const stateCardPost = ref(false);
            const onSwiper = (swiper: any) => {
            };
            const onSlideChange = () => {
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
            async openPostInfo(index: number) {
                if(this.stateCardPost){
                    this.stateCardPost = false;
                    await nextTick();
                }
                this.dataCardPost = this.dataList[index];
                this.stateCardPost = true;
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
    .container {
      position: relative;
      width: 100%;
    }

    .swiper {
      width: 100%;
    }

    .custom-swiper-prev,
    .custom-swiper-next {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      cursor: pointer;
      color: var(--text-primary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--accent-pink);
        color: white;
        border-color: var(--accent-pink);
      }
    }
    .custom-swiper-prev { left: -8px; }
    .custom-swiper-next { right: -8px; }

    .voir-plus-slide {
      display: flex !important;
      align-items: center;
      justify-content: center;
      min-width: 110px !important;
      max-width: 110px !important;
    }

    .voir-plus-btn {
      width: 100%;
      min-height: 260px;
      background: var(--bg-tertiary);
      border: 1.5px dashed var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        border-color: var(--accent-pink);
        color: var(--accent-pink);
        background: rgba(255, 45, 120, 0.05);
      }
    }

    .post-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
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
