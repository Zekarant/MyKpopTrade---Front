<template>
  <div class="negotiate-view">
    <div class="container">
      <div class="header">
        <button type="button" class="back-btn" @click="goBack">
          <i class="bi bi-arrow-left"></i>
          Retour
        </button>
        <h1>Faire une offre</h1>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div v-else-if="product && bounds" class="content">
        <NegotiateProductSummary :product="product" :bounds="bounds" />
        <NegotiateOfferForm :product="product" :bounds="bounds" @cancel="goBack" />
      </div>

      <div v-else class="error-state">
        <i class="bi bi-exclamation-triangle"></i>
        <p>Produit non trouvé</p>
        <button type="button" class="btn-primary" @click="goBack">
          Retour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import postService from '@/services/post.service';
import type { ProductDetail } from '@/types/post.types';
import { offerBounds } from '@/components/offerRules';
import NegotiateProductSummary from './negotiate/NegotiateProductSummary.vue';
import NegotiateOfferForm from './negotiate/NegotiateOfferForm.vue';

defineOptions({ name: 'NegotiateView' });

/** Paramètre de la route /negotiate/:productId (`props: true`). */
const props = defineProps<{ productId: string }>();

const router = useRouter();

const product = ref<ProductDetail | null>(null);
const loading = ref(true);

const bounds = computed(() => (product.value ? offerBounds(product.value) : null));

async function loadProduct() {
  loading.value = true;
  try {
    // GET /api/products/:id renvoie { product, isFavorite }.
    const response = await postService.getPost(props.productId);
    product.value = response.product;
  } catch (error) {
    console.error('Erreur lors du chargement du produit:', error);
    product.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

onMounted(loadProduct);
</script>

<style lang="scss" scoped>
.negotiate-view {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;

  h1 {
    margin: 0;
    font-size: 28px;
    color: var(--text-primary);
  }
}

.back-btn {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

.loading,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  // Surcharge du `.spinner` global (_animations.scss) : plus grand, aux couleurs de la page.
  .spinner {
    border: 3px solid var(--surface-border);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  i {
    font-size: 60px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  p {
    color: var(--text-secondary);
    margin: 20px 0;
  }
}

.content {
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    h1 {
      font-size: 24px;
    }
  }
}
</style>
