<template>
    <swiper
        :navigation="true" :pagination="true" :modules="modules">
    <swiper-slide v-for="(image, index) in images" :key="index">
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
            required: true,
        },
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