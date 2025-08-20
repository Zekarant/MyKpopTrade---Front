<template>
  <swiper 
    v-if="images && images.length > 0"
    :navigation="true" 
    :pagination="true" 
    :modules="modules"
    :initial-slide="predefinedIndex"
  >
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
    },
    predefinedIndex: {
      type: Number,
      default: 0,
      required: false,
      validator(value) {
        return value >= 0;
      }
    }
  },
  setup() {
    const onSwiper = (swiper) => {
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
      return this.images.map(img => {
        // Si l'image commence par 'data:' (base64) ou 'http' (URL complète), 
        // on la retourne telle quelle
        if (img.startsWith('data:') || img.startsWith('http')) {
          return img;
        }
        // Sinon, on ajoute le baseUrl
        return `${baseUrl}${img}`;
      });
    }
  },
  watch: {
    // Optionnel: si predefinedIndex change après le montage
    predefinedIndex(newIndex) {
      if (this.$refs.swiper && this.$refs.swiper.swiper) {
        this.$refs.swiper.swiper.slideTo(newIndex, 0); // 0 = pas d'animation
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