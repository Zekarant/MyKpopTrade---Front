<template>
  <main class="page">
  <div class="add-review-container">
    <div class="add-review-content">
      <h1>Ajouter un avis</h1>

      <div v-if="loading" class="loading">
        <p>Chargement...</p>
      </div>

      <div v-else>
        <div v-if="product" class="product-display">
          <div class="product-image">
            <img :src="mediaUrl(product.images[0])" :alt="product.title" />
          </div>
          <div class="product-info">
            <h2>{{ product.title }}</h2>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-meta">
              <span class="price">{{ product.price }} {{ product.currency }}</span>
              <span class="condition">{{ product.condition }}</span>
            </div>
          </div>
        </div>

        <ReviewForm :transaction-id="transactionId" :recipient-id="recipientId" :initial-error="loadError" />
      </div>
    </div>
  </div>
  </main>
</template>

<script setup lang="ts">
/** Page « Ajouter un avis » : rappel de l'article acheté, puis formulaire d'avis sur son vendeur. */
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import postService from '@/services/post.service';
import type { ProductDetail } from '@/types/post.types';
import { mediaUrl } from '@/utils/format';
import { sellerIdOf } from '@/components/sellerId';
import ReviewForm from './add_review/ReviewForm.vue';

const route = useRoute();

const loading = ref(true);
const loadError = ref('');
const product = ref<ProductDetail | null>(null);
const transactionId = ref('');
const recipientId = ref('');

onMounted(async () => {
  const productId = route.params.id as string;
  if (!productId) {
    loadError.value = 'ID du produit manquant';
    loading.value = false;
    return;
  }
  try {
    const response = await postService.getPost(productId);
    product.value = response.product;
    // L'avis porte sur la transaction de cet article : son identifiant en tient lieu.
    transactionId.value = productId;
    recipientId.value = sellerIdOf(response.product.seller) ?? '';
  } catch (error) {
    const err = error as Record<string, unknown>;
    loadError.value = (err.message as string) || 'Erreur lors du chargement du produit';
    console.error('Erreur:', error);
  }
  loading.value = false;
});
</script>

<style scoped lang="scss">
.add-review-container {
  min-height: calc(100vh - 60px);
  padding: 40px 20px;
  background: linear-gradient(135deg, var(--light-color) 0%, white 100%);
}

.add-review-content {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 30px;
    text-align: center;
  }
}

.product-display {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--secondary-color-tint);

  .product-image {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--light-color);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2,
    .product-description {
      margin: 0;
      line-height: 1.4;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-color);
      max-height: 2.8em;
    }

    .product-description {
      font-size: 13px;
      color: var(--secondary-color);
      max-height: 2.6em;
    }

    .product-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 4px;

      .price {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-color);
      }

      .condition {
        font-size: 12px;
        color: white;
        background-color: var(--secondary-color);
        padding: 2px 8px;
        border-radius: 4px;
      }
    }
  }
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: var(--secondary-color);
}

@media (max-width: 768px) {
  .add-review-content {
    padding: 20px;

    h1 {
      font-size: 24px;
    }
  }

  .product-display {
    gap: 15px;

    .product-image {
      width: 100px;
      height: 100px;
    }

    .product-info {
      h2 {
        font-size: 14px;
      }

      .product-description {
        font-size: 12px;
      }
    }
  }
}
</style>
