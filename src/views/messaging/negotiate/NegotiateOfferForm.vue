<template>
  <div class="negotiation-form">
    <h3>Votre offre</h3>

    <div class="form-group">
      <label for="offer-amount">Montant de votre offre</label>
      <div class="price-input-group">
        <input
          id="offer-amount"
          v-model.number="offerAmount"
          type="number"
          :min="bounds.min"
          :max="bounds.mode === 'pwyw' ? bounds.max ?? undefined : product.price"
          step="0.01"
          placeholder="0.00"
          class="form-control price-input"
          @input="validateOffer"
        />
        <span class="currency">€</span>
      </div>

      <!-- Les pourcentages du prix n'ont pas de sens pour un prix libre, borné par sa fourchette. -->
      <div v-if="bounds.mode === 'negotiation'" class="price-helpers">
        <button
          v-for="percentage in OFFER_PERCENTAGES"
          :key="percentage"
          type="button"
          class="percentage-btn"
          :class="{ active: isPercentageActive(percentage) }"
          @click="setOfferPercentage(percentage)"
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
      <label for="offer-message">Message au vendeur (optionnel)</label>
      <textarea
        id="offer-message"
        v-model="message"
        rows="4"
        placeholder="Expliquez pourquoi vous faites cette offre..."
        class="form-control"
      ></textarea>
    </div>

    <NegotiateOfferSummary :amount="offerAmount" :price="product.price" />

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="emit('cancel')">
        Annuler
      </button>
      <button type="button" :disabled="!canSubmit" class="btn-primary" @click="submitOffer">
        <i class="bi bi-tag"></i>
        Envoyer l'offre
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessagingStore } from '@/store/messaging.store';
import type { ProductDetail } from '@/types/post.types';
import { validateOfferAmount, type OfferBounds } from '@/components/offerRules';
import NegotiateOfferSummary from './NegotiateOfferSummary.vue';

const OFFER_PERCENTAGES = [50, 60, 70, 80, 90];

const props = defineProps<{
  product: ProductDetail;
  bounds: OfferBounds;
}>();

const emit = defineEmits<{ cancel: [] }>();

const router = useRouter();
const messagingStore = useMessagingStore();

// Offre proposée par défaut : le plancher accepté (au moins un centime).
const offerAmount = ref<number>(Math.max(props.bounds.min, 0.01));
const message = ref('');
const offerError = ref('');
const submitting = ref(false);

const canSubmit = computed(() =>
  validateOfferAmount(offerAmount.value, props.product) === null &&
  !offerError.value &&
  !submitting.value
);

function validateOffer() {
  offerError.value = validateOfferAmount(offerAmount.value, props.product) ?? '';
}

function setOfferPercentage(percentage: number) {
  offerAmount.value = Math.round(props.product.price * percentage / 100 * 100) / 100;
  validateOffer();
}

function isPercentageActive(percentage: number) {
  if (!props.product.price) return false;
  return Math.round((offerAmount.value / props.product.price) * 100) === percentage;
}

async function submitOffer() {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    const response = await messagingStore.initiateNegotiation(
      props.product._id,
      offerAmount.value,
      message.value
    );
    router.push({ name: 'conversation', params: { id: response.conversation._id } });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'offre:', error);
    offerError.value = (error as { message?: string })?.message || 'Une erreur est survenue. Veuillez réessayer.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.negotiation-form {
  padding: 30px;

  h3 {
    margin: 0 0 20px 0;
    font-size: 20px;
    color: var(--text-primary);
  }
}

.form-group {
  margin-bottom: 25px;

  label {
    display: block;
    margin-bottom: 10px;
    font-weight: 500;
    color: var(--text-primary);
  }
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
    color: var(--text-secondary);
  }
}

.price-helpers {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.percentage-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--surface-border);
  background: var(--bg-card);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-secondary);
  }

  &.active {
    background: var(--primary-color);
    color: var(--bg-card);
    border-color: var(--primary-color);
  }
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--surface-border);
  border-radius: 5px;
  font-size: 14px;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: var(--primary-color);
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
  color: var(--danger);
  font-size: 14px;

  i {
    font-size: 16px;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .negotiation-form {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
