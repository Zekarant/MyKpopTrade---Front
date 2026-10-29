<template>
  <div v-dismiss="cancel" class="popup-overlay" @mousedown.stop>
    <div
      ref="dialog"
      class="checkout-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      @click.stop
      @mousedown.stop
    >
      <button type="button" class="close-btn" aria-label="Fermer" @click="cancel">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>

      <h2 :id="titleId">Finaliser votre achat</h2>

      <div class="product-summary">
        <strong>{{ productTitle }}</strong>
        <span class="price">{{ formatAmount(productPrice) }}</span>
      </div>

      <section class="checkout-section">
        <h3 :id="methodsTitleId">Méthode de livraison</h3>
        <p v-if="availableMethods.length === 0" class="empty">
          Le vendeur n'a configuré aucune méthode de livraison disponible. Contactez-le via la messagerie.
        </p>
        <div v-else role="radiogroup" :aria-labelledby="methodsTitleId">
          <label
            v-for="m in availableMethods"
            :key="m.value"
            class="method-option"
            :class="{ selected: selectedMethod === m.value }"
          >
            <input v-model="selectedMethod" type="radio" :value="m.value" />
            <span class="method-label">{{ m.label }}</span>
            <span class="method-cost">{{ formatCost(m.cost) }}</span>
          </label>
        </div>
      </section>

      <section v-if="selectedMethod && selectedMethod !== 'localPickup'" class="checkout-section">
        <h3>Adresse de livraison</h3>
        <CheckoutAddressForm v-model="address" />
      </section>

      <section v-if="selectedMethod" class="totals">
        <div class="line">
          <span>Produit</span>
          <span>{{ formatAmount(productPrice) }}</span>
        </div>
        <div class="line">
          <span>Livraison</span>
          <span>{{ formatCost(shippingCost) }}</span>
        </div>
        <div class="line total">
          <span>Total</span>
          <span>{{ formatAmount(totalAmount) }}</span>
        </div>
      </section>

      <div v-if="errorMessage" class="error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i> {{ errorMessage }}
      </div>

      <div class="actions">
        <button
          type="button"
          class="btn-pay btn-pay--paypal"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          <span v-if="submitting">
            <i class="bi bi-arrow-repeat spin" aria-hidden="true"></i> Redirection…
          </span>
          <span v-else>
            <i class="bi bi-paypal" aria-hidden="true"></i> Payer avec PayPal
          </span>
        </button>
        <button type="button" class="btn-cancel" :disabled="submitting" @click="cancel">Annuler</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Achat direct d'une annonce : livraison, adresse, puis redirection PayPal (via l'émetteur de `confirm`). */
import { computed, ref, useId } from 'vue';
import { apiErrorMessage } from '@/services/apiError';
import paymentService, { type ShippingMethod, type ShippingAddressPayload, type InitPayPalPayload } from '@/services/payment.service';
import { formatPrice } from '@/utils/format';
import CheckoutAddressForm from './CheckoutAddressForm.vue';
import { availableShippingChoices, resolveShippingCost, type ShippingOptionsLike } from './checkoutShipping';
import { sumAmounts } from '@/utils/money';
import { isShippingAddressComplete, toShippingAddressPayload } from '@/utils/address';
import { useDialogFocus } from '@/composables/useDialogFocus';
import { vDismiss } from '@/composables/vDismiss';

interface PaypalLikeResult {
  success: boolean;
  payment?: {
    id: string;
    paypalOrderId: string;
    approvalUrl?: string;
  };
}

const props = withDefaults(defineProps<{
  productId: string | number;
  productTitle: string;
  /** Prix produit en unités (euros), tel que l'API le facture. */
  productPrice: number;
  currency?: string;
  shippingOptions: ShippingOptionsLike;
}>(), {
  currency: 'EUR'
});

const emit = defineEmits<{
  confirm: [result: PaypalLikeResult];
  cancel: [];
}>();

const dialog = ref<HTMLElement | null>(null);
// Focus sur la boîte elle-même (tabindex="-1") : le lecteur d'écran lit son titre d'abord.
useDialogFocus(dialog, dialog, cancel);
const titleId = `checkout-title-${useId()}`;
const methodsTitleId = `checkout-methods-${useId()}`;

const submitting = ref(false);
const errorMessage = ref('');

const options = computed(() => props.shippingOptions ?? {});
const availableMethods = computed(() => availableShippingChoices(options.value));
const selectedMethod = ref<ShippingMethod | ''>(availableMethods.value[0]?.value ?? '');

const address = ref<ShippingAddressPayload>({
  recipientName: '',
  streetLine1: '',
  streetLine2: '',
  postalCode: '',
  city: '',
  country: 'FR',
  phone: ''
});

const shippingCost = computed(() =>
  selectedMethod.value ? resolveShippingCost(options.value, selectedMethod.value) ?? 0 : 0
);
// Additionné en centimes : 19.99 + 4.99 doit afficher 24,98, pas un flottant arrondi au hasard.
const totalAmount = computed(() => sumAmounts([props.productPrice, shippingCost.value]));

const formatAmount = (amount: number) => formatPrice(amount, props.currency);
const formatCost = (cost: number) => (cost === 0 ? 'Gratuit' : formatAmount(cost));

const isAddressFilled = computed(() => isShippingAddressComplete(address.value));

const canSubmit = computed(() => {
  if (!selectedMethod.value) return false;
  return selectedMethod.value === 'localPickup' || isAddressFilled.value;
});

function buildPayload(method: ShippingMethod): InitPayPalPayload {
  const payload: InitPayPalPayload = { productId: props.productId, shippingMethod: method };
  if (method !== 'localPickup') {
    payload.shippingAddress = toShippingAddressPayload(address.value);
  }
  return payload;
}

async function submit() {
  if (!canSubmit.value || submitting.value || !selectedMethod.value) return;
  submitting.value = true;
  errorMessage.value = '';
  try {
    const result = (await paymentService.initPayPal(buildPayload(selectedMethod.value))) as PaypalLikeResult;
    if (!result.success || !result.payment) {
      errorMessage.value = 'Le paiement n\'a pas pu être initialisé.';
      return;
    }
    emit('confirm', result);
  } catch (err) {
    errorMessage.value = apiErrorMessage(err, 'Une erreur est survenue lors de l\'initialisation du paiement.');
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  if (submitting.value) return;
  emit('cancel');
}
</script>

<style scoped lang="scss">
.checkout-modal {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-xl);
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.25s ease;

  &:focus { outline: none; }
}

.close-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: transparent;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
}

h2 {
  margin: 0 0 var(--space-lg);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

h3 {
  margin: 0 0 var(--space-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.product-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);

  strong { color: var(--text-primary); font-size: var(--font-size-sm); }

  .price {
    font-weight: 700;
    color: var(--accent-pink);
    font-size: var(--font-size-md);
  }
}

.checkout-section {
  margin-bottom: var(--space-xl);

  .empty {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    font-style: italic;
  }
}

.method-option {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  gap: var(--space-md);
  background: var(--bg-tertiary);
  transition: all var(--transition-fast);

  &:hover { border-color: var(--accent-pink-light); }

  &.selected {
    border-color: var(--accent-pink);
    background: color-mix(in srgb, var(--accent-pink) 5%, transparent);
    box-shadow: var(--focus-ring);
  }

  input[type="radio"] {
    accent-color: var(--accent-pink);
    margin: 0;
  }

  .method-label {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .method-cost {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

.totals {
  border-top: 1px solid var(--surface-border);
  padding-top: var(--space-md);
  margin-bottom: var(--space-lg);

  .line {
    display: flex;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);

    &.total {
      border-top: 1px solid var(--surface-border);
      margin-top: var(--space-sm);
      padding-top: var(--space-md);
      font-weight: 700;
      color: var(--text-primary);
      font-size: var(--font-size-md);
    }
  }
}

.error {
  background: var(--danger-light);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  color: var(--danger);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.btn-cancel,
.btn-pay {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  border: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--surface-border);
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}

.btn-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;

  &:hover { opacity: 0.92; transform: translateY(-1px); }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &--paypal {
    background: var(--paypal-gold);
    color: var(--paypal-blue);
  }
}
</style>
