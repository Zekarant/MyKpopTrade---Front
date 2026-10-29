<template>
  <div class="product-section">
    <div class="product-images">
      <img
        :src="product.images[0] ? mediaUrl(product.images[0]) : '/placeholder.png'"
        decoding="async"
        :alt="product.title"
        class="main-image"
      />
    </div>

    <div class="product-info">
      <h2>{{ product.title }}</h2>
      <p class="description">{{ product.description }}</p>

      <div class="price-info">
        <div class="current-price">
          <span class="label">Prix demandé</span>
          <span class="price">{{ product.price }} €</span>
        </div>

        <div v-if="bounds.mode === 'pwyw'" class="min-offer">
          <span class="label">Prix libre</span>
          <span class="price">{{ pwywRangeLabel(product.pwywMinPrice, product.pwywMaxPrice) }}</span>
        </div>
        <div v-else class="min-offer">
          <span class="label">Offre minimum acceptée</span>
          <span class="price">{{ bounds.min }} € ({{ bounds.minPercentage }}%)</span>
        </div>
      </div>

      <div class="seller-info">
        <i class="bi bi-person"></i>
        <span>Vendu par {{ product.seller?.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mediaUrl } from '@/utils/format';
import type { ProductDetail } from '@/types/post.types';
import { pwywRangeLabel, type OfferBounds } from '@/components/offerRules';

defineProps<{
  product: ProductDetail;
  bounds: OfferBounds;
}>();
</script>

<style lang="scss" scoped>
.product-section {
  display: flex;
  gap: 30px;
  padding: 30px;
  border-bottom: 1px solid var(--surface-border);

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 20px;
  }
}

.product-images {
  flex: 0 0 300px;
}

.main-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  flex: 1;

  h2 {
    margin: 0 0 15px 0;
    font-size: 24px;
    color: var(--text-primary);
  }
}

.description {
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.price-info {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.current-price,
.min-offer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    color: var(--text-secondary);
    font-size: 14px;
  }

  .price {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-primary);
  }
}

.min-offer .price {
  font-size: 16px;
  color: var(--text-secondary);
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;

  i {
    font-size: 16px;
  }
}
</style>
