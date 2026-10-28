<template>
  <div class="row-products">
   <div class="container">
    <swiper
        v-if="dataList.length > 0"
        class="custom-swiper-nav"
        :navigation="{ nextEl: '.custom-swiper-next', prevEl: '.custom-swiper-prev' }"
        :a11y="{ prevSlideMessage: 'Annonces précédentes', nextSlideMessage: 'Annonces suivantes' }"
        :modules="modules"
        :slides-per-view="4"
        :space-between="20"
        :breakpoints="{
            0: { slidesPerView: 1 },
            720: { slidesPerView: 2 },
            980: { slidesPerView: 4 }
        }"
    >
        <swiper-slide v-for="item in visibleList" :key="item._id">
            <card :data="item" @open="openPost" @remove-favorite="removeFavorite" />
        </swiper-slide>
        <button type="button" class="custom-swiper-prev">
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <button type="button" class="custom-swiper-next">
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
        <swiper-slide v-if="hasMorePages(pagination)" class="voir-plus-slide">
            <button type="button" class="voir-plus-btn" @click="onVoirPlus">Voir plus</button>
        </swiper-slide>
    </swiper>
   </div>
  </div>
  <Teleport to="body">
    <div v-if="openedPost" class="post-overlay" @click.self="closePost">
        <post :key="openedPost._id" :id-post="openedPost._id" @close-post="closePost" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** Carrousel horizontal d'annonces (favoris du tableau de bord). */
import { computed } from 'vue';
import { Navigation, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/navigation';
import post from '@/components/post.vue';
import card from '@/components/card.vue';
import type { Post } from '@/types/post.types';
import { useFavoriteRemoval } from '@/composables/useFavoriteRemoval';
import { usePostOverlay } from '@/components/post/usePostOverlay';
import { hasMorePages, type ListPagination } from '@/components/post/types';

const props = withDefaults(defineProps<{
    dataList?: Post[];
    pagination?: ListPagination;
    /** Inutilisé ici, mais déclaré pour ne pas finir en attribut HTML sur la racine. */
    moreBtn?: boolean;
}>(), {
    dataList: () => [],
    pagination: () => ({ limit: 1, page: 1, pages: 1, total: 10 }),
    moreBtn: false,
});

const emit = defineEmits<{
    voirPlus: [payload: { products: Post[]; pagination: ListPagination; type: 'PageFavorites' }];
}>();

const modules = [Navigation, A11y];
const { isRemoved, removeFavorite } = useFavoriteRemoval();
const { openedPost, openPost, closePost } = usePostOverlay();

// Filtré plutôt que masqué : une diapositive cachée laisserait un trou dans le carrousel.
const visibleList = computed(() => props.dataList.filter((item) => !isRemoved(item)));

function onVoirPlus() {
    emit('voirPlus', { products: props.dataList, pagination: props.pagination, type: 'PageFavorites' });
}
</script>

<!-- Scopé : les flèches sont dans ce gabarit (slot du carrousel), elles portent donc l'attribut de portée. -->
<style lang="scss" scoped>
.row-products {
  display: flex;
  align-items: center;
}

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
  top: 40%;
  transform: translateY(-50%);
  z-index: 10;
  width: 45px;
  height: 45px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
  font-size: 1.5em;
  font-weight: bold;
  line-height: 1;
  opacity: 0.9;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast), color var(--transition-fast), opacity 0.2s;

  &:hover {
    background: var(--accent-pink);
    color: var(--text-on-accent);
    border-color: var(--accent-pink);
  }

  &.swiper-button-disabled {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }
}

.custom-swiper-prev { left: 10px; }
.custom-swiper-next { right: 10px; }

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
    background: color-mix(in srgb, var(--accent-pink) 5%, transparent);
  }
}
</style>
