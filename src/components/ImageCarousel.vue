<template>
  <Swiper
    v-if="imagesWithDomain.length > 0"
    :navigation="true"
    :pagination="true"
    :modules="modules"
    :initial-slide="predefinedIndex"
    @swiper="onSwiper"
  >
    <SwiperSlide v-for="(image, index) in imagesWithDomain" :key="`${index}-${image}`">
      <!-- Pas d'aspect-ratio ici : le carrousel sert aussi en grand format ; la place
           est réservée par le conteneur (carré dans card.vue). -->
      <img
        v-if="!failed.has(image)"
        class="carousel-image"
        :src="image"
        :alt="altOf(index)"
        loading="lazy"
        decoding="async"
        @error="failed.add(image)"
      />
      <div v-else class="img-fallback" role="img" :aria-label="`${altOf(index)} (indisponible)`">
        <i class="bi bi-image" aria-hidden="true"></i>
        <span>Image indisponible</span>
      </div>
    </SwiperSlide>
  </Swiper>
  <div v-else class="carousel-placeholder">
    <i class="bi bi-image" aria-hidden="true"></i>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { mediaUrl } from '@/utils/format';

const props = withDefaults(defineProps<{
  images?: Array<string | undefined>;
  /** Diapositive affichée à l'ouverture (pièces jointes de la messagerie). */
  predefinedIndex?: number;
  /** Ce que montrent les photos (titre de l'annonce…), repris dans leur texte alternatif. */
  alt?: string;
}>(), { images: () => [], predefinedIndex: 0, alt: '' });

const modules = [Navigation, Pagination, A11y];
const failed = reactive(new Set<string>());
let swiper: SwiperClass | null = null;

// Aperçus base64 et URL absolues passent tels quels ; les chemins de l'API sont préfixés.
const imagesWithDomain = computed(() => props.images.filter(Boolean).map((img) => mediaUrl(img)));

function altOf(index: number): string {
  const position = `Photo ${index + 1} sur ${imagesWithDomain.value.length}`;
  return props.alt ? `${position} — ${props.alt}` : position;
}

function onSwiper(instance: SwiperClass) {
  swiper = instance;
}

// La messagerie réutilise le même carrousel pour une autre pièce jointe.
watch(() => props.predefinedIndex, (index) => swiper?.slideTo(index, 0));
</script>

<style lang="scss" scoped>
.swiper {
  display: block;
  width: 100%;
  height: 100%;
}

:deep(.swiper-slide) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: 2.5rem;
}

.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-size: 0.8rem;

  .bi {
    font-size: 2.5rem;
  }
}
</style>
