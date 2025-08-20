<template>
  <div class="negotiate-view">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <button @click="goBack" class="back-btn">
          <i class="bi bi-arrow-left"></i>
          Retour
        </button>
        <h1>Faire une offre</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Product info -->
      <div v-else-if="product" class="content">
        <div class="product-section">
          <div class="product-images">
            <img
              :src="product.images[0] || '/placeholder.png'"
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

              <div v-if="product.minOfferPercentage" class="min-offer">
                <span class="label">Offre minimum acceptée</span>
                <span class="price">{{ minOfferAmount }} € ({{ product.minOfferPercentage }}%)</span>
              </div>
            </div>

            <div class="seller-info">
              <i class="bi bi-person"></i>
              <span>Vendu par {{ product.seller.username }}</span>
            </div>
          </div>
        </div>

        <!-- Negotiation form -->
        <div class="negotiation-form">
          <h3>Votre offre</h3>

          <div class="form-group">
            <label>Montant de votre offre</label>
            <div class="price-input-group">
              <input
                v-model.number="offerAmount"
                type="number"
                :min="minOfferAmount"
                :max="product.price"
                step="0.01"
                placeholder="0.00"
                class="form-control price-input"
                @input="validateOffer"
              />
              <span class="currency">€</span>
            </div>

            <div class="price-helpers">
              <button
                v-for="percentage in offerPercentages"
                :key="percentage"
                @click="setOfferPercentage(percentage)"
                class="percentage-btn"
                :class="{ active: isPercentageActive(percentage) }"
              >
                {{ percentage }}%
              </button>
            </div>

            <div v-if="offerError" class="error-message">
              <i class="bi bi-exclamation-circle"></i>
              {{ offerError }}
            </div>
          </div>

          <div class="form-group">
            <label>Message au vendeur (optionnel)</label>
            <textarea
              v-model="message"
              rows="4"
              placeholder="Expliquez pourquoi vous faites cette offre..."
              class="form-control"
            ></textarea>
          </div>

          <div class="offer-summary">
            <div class="summary-row">
              <span>Votre offre :</span>
              <strong>{{ offerAmount || 0 }} €</strong>
            </div>
            <div class="summary-row">
              <span>Économie :</span>
              <strong class="savings">{{ savings }} € ({{ savingsPercentage }}%)</strong>
            </div>
          </div>

          <div class="form-actions">
            <button @click="goBack" class="btn-secondary">
              Annuler
            </button>
            <button
              @click="submitOffer"
              :disabled="!canSubmit"
              class="btn-primary"
            >
              <i class="bi bi-tag"></i>
              Envoyer l'offre
            </button>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else class="error-state">
        <i class="bi bi-exclamation-triangle"></i>
        <p>Produit non trouvé</p>
        <button @click="goBack" class="btn-primary">
          Retour
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessagingStore } from '@/stores/messaging.store';
import productService from '@/services/products'; // À adapter selon votre service

export default defineComponent({
  name: 'NegotiateView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const messagingStore = useMessagingStore();

    // State
    const product = ref<any>(null);
    const loading = ref(true);
    const offerAmount = ref<number>(0);
    const message = ref('');
    const offerError = ref('');
    const submitting = ref(false);

    // Constants
    const offerPercentages = [50, 60, 70, 80, 90];

    // Computed
    const productId = computed(() => route.params.productId as string);

    const minOfferAmount = computed(() => {
      if (!product.value) return 0;
      const percentage = product.value.minOfferPercentage || 50;
      return Math.round(product.value.price * percentage / 100 * 100) / 100;
    });

    const savings = computed(() => {
      if (!product.value || !offerAmount.value) return 0;
      return Math.round((product.value.price - offerAmount.value) * 100) / 100;
    });

    const savingsPercentage = computed(() => {
      if (!product.value || !offerAmount.value) return 0;
      return Math.round((savings.value / product.value.price) * 100);
    });

    const canSubmit = computed(() => {
      return offerAmount.value >= minOfferAmount.value &&
             offerAmount.value < product.value?.price &&
             !offerError.value &&
             !submitting.value;
    });

    // Methods
    const loadProduct = async () => {
      loading.value = true;
      try {
        // Remplacer par votre service de produits
        const response = await productService.getProduct(productId.value);
        product.value = response;

        // Définir une offre initiale
        offerAmount.value = minOfferAmount.value;
      } catch (error) {
        console.error('Erreur lors du chargement du produit:', error);
        product.value = null;
      } finally {
        loading.value = false;
      }
    };

    const validateOffer = () => {
      offerError.value = '';

      if (offerAmount.value < minOfferAmount.value) {
        offerError.value = `L'offre minimum est de ${minOfferAmount.value} €`;
      } else if (offerAmount.value >= product.value.price) {
        offerError.value = 'L\'offre doit être inférieure au prix demandé';
      }
    };

    const setOfferPercentage = (percentage: number) => {
      offerAmount.value = Math.round(product.value.price * percentage / 100 * 100) / 100;
      validateOffer();
    };

    const isPercentageActive = (percentage: number) => {
      const currentPercentage = Math.round((offerAmount.value / product.value?.price) * 100);
      return currentPercentage === percentage;
    };

    const submitOffer = async () => {
      if (!canSubmit.value) return;

      submitting.value = true;
      try {
        const response = await messagingStore.initiateNegotiation(
          productId.value,
          offerAmount.value,
          message.value
        );

        // Rediriger vers la conversation
        router.push({
          name: 'conversation',
          params: { id: response.conversation._id }
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'offre:', error);
        offerError.value = 'Une erreur est survenue. Veuillez réessayer.';
      } finally {
        submitting.value = false;
      }
    };

    const goBack = () => {
      router.back();
    };

    onMounted(() => {
      loadProduct();
    });

    return {
      product,
      loading,
      offerAmount,
      message,
      offerError,
      offerPercentages,
      minOfferAmount,
      savings,
      savingsPercentage,
      canSubmit,
      validateOffer,
      setOfferPercentage,
      isPercentageActive,
      submitOffer,
      goBack
    };
  }
});
</script>

<style lang="scss" scoped>
.negotiate-view {
  min-height: 100vh;
  background: #f5f5f5;
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

  .back-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;

    &:hover {
      background: #f5f5f5;
      color: #333;
    }
  }

  h1 {
    margin: 0;
    font-size: 28px;
    color: #333;
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

  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  i {
    font-size: 60px;
    color: #ddd;
    margin-bottom: 20px;
  }

  p {
    color: #666;
    margin: 20px 0;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }
}

.content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.product-section {
  display: flex;
  gap: 30px;
  padding: 30px;
  border-bottom: 1px solid #e0e0e0;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 20px;
  }

  .product-images {
    flex: 0 0 300px;

    .main-image {
      width: 100%;
      height: 300px;
      object-fit: cover;
      border-radius: 8px;
    }
  }

  .product-info {
    flex: 1;

    h2 {
      margin: 0 0 15px 0;
      font-size: 24px;
      color: #333;
    }

    .description {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .price-info {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;

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
          color: #666;
          font-size: 14px;
        }

        .price {
          font-size: 20px;
          font-weight: bold;
          color: var(--primary-color);
        }
      }

      .min-offer .price {
        font-size: 16px;
        color: #666;
      }
    }

    .seller-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;

      i {
        font-size: 16px;
      }
    }
  }
}

.negotiation-form {
  padding: 30px;

  h3 {
    margin: 0 0 20px 0;
    font-size: 20px;
    color: #333;
  }

  .form-group {
    margin-bottom: 25px;

    label {
      display: block;
      margin-bottom: 10px;
      font-weight: 500;
      color: #333;
    }

    .price-input-group {
      display: flex;
      align-items: center;
      position: relative;

      .price-input {
        font-size: 24px;
        font-weight: bold;
        padding-right: 40px;
        text-align: right;
      }

      .currency {
        position: absolute;
        right: 15px;
        font-size: 20px;
        color: #666;
      }
    }

    .price-helpers {
      display: flex;
      gap: 8px;
      margin-top: 12px;

      .percentage-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
          background: #f5f5f5;
        }

        &.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      }
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      outline: none;
      font-family: inherit;

      &:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
      }
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: var(--danger-color);
      font-size: 14px;

      i {
        font-size: 16px;
      }
    }
  }

  .offer-summary {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      span {
        color: #666;
      }

      strong {
        font-size: 18px;
        color: #333;

        &.savings {
          color: #28a745;
        }
      }
    }
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;

      &.btn-secondary {
        background: #f0f0f0;
        color: #333;

        &:hover {
          background: #e0e0e0;
        }
      }

      &.btn-primary {
        background: var(--primary-color);
        color: white;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        i {
          font-size: 18px;
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

  .negotiation-form {
    padding: 20px;

    .form-actions {
      flex-direction: column;

      button {
        width: 100%;
        justify-content: center;
      }
    }
  }
}</style>
