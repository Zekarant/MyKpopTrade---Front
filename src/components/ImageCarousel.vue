<template>
  <swiper 
    v-if="images && images.length > 0"
    :navigation="true" 
    :pagination="true" 
    :modules="modules"
    :initial-slide="predefinedIndex"
    ref="swiperRef"
  >
    <swiper-slide v-for="(image, index) in imagesWithDomain" :key="index">
      <img style="width: 100%; height: 100%; object-fit: contain;" :src="image" alt="Slide image" />
    </swiper-slide>
  </swiper>
</template>

<script lang="ts">
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
      type: Array as () => Array<string | undefined>,
      default: () => []
    },
    predefinedIndex: {
      type: Number,
      default: 0,
      required: false,
      validator(value: number) {
        return value >= 0;
      }
    }
  },
  setup() {
    const onSwiper = () => {
    };
    const onSlideChange = () => {
    };
    return {
      onSwiper,
      onSlideChange,
      modules: [Navigation, Pagination, A11y],
    };
  },
  computed: {
    imagesWithDomain() {
      const baseUrl = import.meta.env.VITE_API_URL;
      return (this.images as Array<string | undefined>).filter(Boolean).map((img: string | undefined): string => {
        // Si l'image commence par 'data:' (base64) ou 'http' (URL complète), 
        // on la retourne telle quelle
        if (img?.startsWith('data:') || img?.startsWith('http')) {
          return img!;
        }
        // Sinon, on ajoute le baseUrl
        return `${baseUrl}${img}`;
      });
    }
  },
  watch: {
    // Optionnel: si predefinedIndex change après le montage
    predefinedIndex(newIndex: number) {
      if (this.$refs.swiperRef && (this.$refs.swiperRef as any).swiper) {
        (this.$refs.swiperRef as any).swiper.slideTo(newIndex, 0); // 0 = pas d'animation
      }
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
    background-color: var(--primary-color) !important;
  }
  :global(.swiper-pagination-bullet-active) {
    background-color: var(--secondary-color-tint) !important;
  }
}

.sample-slider [class^="swiper-button-"]{
  color: yellow;
}
</style>
