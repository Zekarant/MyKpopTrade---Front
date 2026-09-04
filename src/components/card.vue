<template>
    <div class="product-card">
        <div class="product-card__image">
            <div v-if="admin && !data.isAvailable" class="product-card__badge product-card__badge--draft">
                Brouillon
            </div>
            <div v-else-if="data.isReserved" class="product-card__badge product-card__badge--reserved">
                Réservé
            </div>
            <ImageCarousel class="product-card__carousel" :images="data.images" />
        </div>
        <div class="product-card__info">
            <h3 class="product-card__title">{{ data.title }}</h3>
            <div v-if="data.seller" class="product-card__seller">
              <span class="product-card__seller-name">@{{ data.seller.username || data.seller }}</span>
              <VerifiedBadge v-if="data.seller.isIdentityVerified" :size="11" />
            </div>
            <span class="product-card__condition">{{ data.condition.charAt(0).toUpperCase() + data.condition.slice(1) }}</span>
            <span class="product-card__price">{{ data.price }} €</span>
        </div>
    </div>
</template>

<script lang="ts">
    import ImageCarousel from '@/components/ImageCarousel.vue';
    import VerifiedBadge from '@/components/VerifiedBadge.vue';

    export default {
        name: "post-card",
        components: {
            ImageCarousel,
            VerifiedBadge,
        },
        props: {
            data: {
                type: Object,
                required: true,
            },
            admin: {
                type: Boolean,
                required: false,
                default: false,
            },
        },
    };
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
        border-color: rgba(255, 45, 120, 0.3);
        box-shadow: var(--shadow-md), 0 0 20px rgba(255, 45, 120, 0.1);
        transform: translateY(-4px);
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

      &--reserved {
        background: var(--info-light);
        color: var(--info);
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
