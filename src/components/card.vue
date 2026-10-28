<template>
    <!-- Pas de <button> : la carte contient déjà des boutons (carrousel, retrait du favori). -->
    <div
        class="product-card"
        :class="{ 'product-card--unavailable': !openable }"
        :role="openable ? 'button' : undefined"
        :tabindex="openable ? 0 : undefined"
        :aria-label="openable ? `Voir l'annonce ${data.title}` : undefined"
        @click="open"
        @keydown.enter.self.prevent="open"
        @keydown.space.self.prevent="open"
    >
        <div class="product-card__image">
            <!-- Brouillon : annonce du vendeur connecté, retirée de la vente sans avoir été vendue. -->
            <div v-if="admin && !data.isAvailable && !data.isSold" class="product-card__badge product-card__badge--draft">
                Brouillon
            </div>
            <!-- Favori vendu ou retiré : la fiche ne s'ouvre plus, on propose de le retirer. -->
            <div v-if="data.unavailableReason" class="product-card__badge product-card__badge--unavailable">
                Plus disponible
            </div>
            <ImageCarousel class="product-card__carousel" :images="data.images" :alt="data.title" />
        </div>
        <div class="product-card__info">
            <h3 class="product-card__title">{{ data.title }}</h3>
            <div v-if="seller" class="product-card__seller">
              <span class="product-card__seller-name">@{{ typeof seller === 'string' ? seller : seller.username }}</span>
              <VerifiedBadge v-if="typeof seller !== 'string' && seller.isIdentityVerified" :size="11" />
            </div>
            <span class="product-card__condition">{{ data.condition.charAt(0).toUpperCase() + data.condition.slice(1) }}</span>
            <!-- L'annonce porte sa devise : « 20 € » en dur affichait aussi les prix en dollars en euros. -->
            <span class="product-card__price">{{ formatPrice(data.price, data.currency || 'EUR') }}</span>
            <button
                v-if="data.unavailableReason"
                type="button"
                class="product-card__remove"
                @click.stop="emit('removeFavorite', data)"
            >
                <i class="bi bi-heartbreak" aria-hidden="true"></i> Retirer des favoris
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
/** Vignette d'une annonce dans les grilles et carrousels. */
import { computed } from 'vue';
import ImageCarousel from '@/components/ImageCarousel.vue';
import VerifiedBadge from '@/components/VerifiedBadge.vue';
import { formatPrice } from '@/utils/format';
import type { Post } from '@/types/post.types';

defineOptions({ name: 'PostCard' });

const props = withDefaults(defineProps<{
    data: Post;
    /** Annonces du vendeur connecté : affiche « Brouillon » sur celles retirées de la vente. */
    admin?: boolean;
}>(), { admin: false });

const emit = defineEmits<{ open: [post: Post]; removeFavorite: [post: Post] }>();

// Favori vendu ou retiré : sa fiche ne regarde plus que son vendeur (404).
const openable = computed(() => !props.data.unavailableReason);

const seller = computed(() => props.data.seller);

function open() {
    if (openable.value) emit('open', props.data);
}
</script>

<style lang="scss" scoped>
    .product-card {
      background: var(--bg-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        border-color: color-mix(in srgb, var(--accent-pink) 30%, transparent);
        box-shadow: var(--shadow-md), var(--accent-glow);
        transform: translateY(-4px);
      }

      &:focus-visible {
        outline: 2px solid var(--accent-pink);
        outline-offset: 2px;
      }
    }

    .product-card__image {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      background: var(--bg-tertiary);
      overflow: hidden;
    }

    .product-card__carousel {
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;

      :deep(.swiper) {
        width: 100%;
        height: 100%;
      }

      :deep(.swiper-slide) {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      :deep(.swiper-slide img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .product-card__badge {
      position: absolute;
      top: var(--space-sm);
      left: var(--space-sm);
      z-index: 2;
      padding: 4px 10px;
      font-size: var(--font-size-xs);
      font-weight: 600;
      border-radius: var(--radius-full);

      &--draft {
        background: var(--warning-light);
        color: var(--warning);
      }

      &--unavailable {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border: 1px solid var(--surface-border);
      }
    }

    .product-card--unavailable {
      cursor: default;

      .product-card__carousel,
      .product-card__title,
      .product-card__price {
        filter: grayscale(1);
        opacity: 0.55;
      }

      &:hover {
        border-color: var(--surface-border);
        box-shadow: none;
        transform: none;
      }
    }

    .product-card__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: var(--space-xs);
      padding: 6px 10px;
      background: transparent;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      font-weight: 600;
      cursor: pointer;

      &:hover {
        border-color: var(--accent-pink);
        color: var(--accent-pink);
      }
    }

    .product-card__info {
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .product-card__title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-card__seller {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .product-card__seller-name {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }

    .product-card__condition {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .product-card__price {
      font-size: var(--font-size-base);
      font-weight: 700;
      color: var(--accent-pink);
      margin-top: 4px;
    }

    @media (max-width: 640px) {
      .product-card__info {
        padding: var(--space-sm);
      }

      .product-card__title {
        font-size: var(--font-size-xs);
      }

      .product-card__price {
        font-size: var(--font-size-sm);
      }
    }
</style>
