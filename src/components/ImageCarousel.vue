<template>
    <swiper v-if="images && images.length > 0"
        :navigation="true" :pagination="true" :modules="modules">
    <swiper-slide v-for="(image, index) in imagesWithDomain" :key="index">
      <img style="width: 100%; height: 100%; object-fit: contain;" :src="image" alt="Slide image" />
    </swiper-slide>
    </swiper>
  </template>
  <script>
    import { Navigation, Pagination, A11y } from 'swiper/modules';

    // Import Swiper Vue.js components
    import { Swiper, SwiperSlide } from 'swiper/vue';

    // Import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';
    import 'swiper/css/pagination';

  
    export default {
      components: {
        Swiper,
        SwiperSlide,
      },
      props: {
        images: {
          type: Array,
          default: () => []
        }
    },
      setup() {
        const onSwiper = (swiper) => {
          console.log(swiper);
        };
        const onSlideChange = () => {
          console.log('slide change');
        };
        return {
          onSwiper,
          onSlideChange,
          modules: [Navigation, Pagination, A11y],
        };
      },
      computed: {
        imagesWithDomain() {
          const baseUrl = import.meta.env.VITE_API_URL; // ou ton domaine en dur si besoin
          return this.images.map(img =>
            img.startsWith('http') ? img : `${baseUrl}${img}`
          );
        }
      }
    };
  </script>
<style lang="scss" scoped>
    .swiper {
        display: block;
        width: 100%;
    }

    .sliderWrapper {
        :global(.swiper-pagination-bullet) {
            background-color: var(--primary-color);
       
        }
        :global(.swiper-pagination-bullet-active) {
            background-color: var(--secondary-color-tint);
        }
        
    }

    .sample-slider [class^="swiper-button-"]{
      color: yellow;
    }
</style>