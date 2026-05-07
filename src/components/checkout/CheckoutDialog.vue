<template>
  <div class="checkout-overlay" @click.self="cancel">
    <div class="checkout-modal">
      <button class="close-btn" @click="cancel" aria-label="Fermer">
        <i class="bi bi-x-lg"></i>
      </button>

      <h2>Finaliser votre achat</h2>

      <div class="product-summary">
        <strong>{{ productTitle }}</strong>
        <span class="price">{{ formatAmount(productPrice) }}</span>
      </div>

      <section class="section">
        <h3>Méthode de livraison</h3>
        <p v-if="availableMethods.length === 0" class="empty">
          Le vendeur n'a configuré aucune méthode de livraison disponible. Contactez-le via la messagerie.
        </p>
        <label
          v-for="m in availableMethods"
          :key="m.value"
          class="method-option"
          :class="{ selected: selectedMethod === m.value }"
        >
          <input type="radio" :value="m.value" v-model="selectedMethod" />
          <span class="method-label">{{ m.label }}</span>
          <span class="method-cost">{{ m.cost === 0 ? 'Gratuit' : formatAmount(m.cost) }}</span>
        </label>
      </section>

      <section class="section" v-if="selectedMethod && selectedMethod !== 'localPickup'">
        <h3>Adresse de livraison</h3>
        <div class="form-grid">
          <div class="full">
            <label>Nom du destinataire</label>
            <input type="text" v-model="address.recipientName" maxlength="100" />
          </div>
          <div class="full">
            <label>Adresse</label>
            <AddressAutocomplete
              v-model="address.streetLine1"
              @select="onAddressPicked"
            />
          </div>
          <div class="full">
            <label>Complément <span class="optional">(facultatif)</span></label>
            <input type="text" v-model="address.streetLine2" maxlength="200" />
          </div>
          <div>
            <label>Code postal</label>
            <input type="text" v-model="address.postalCode" maxlength="16" />
          </div>
          <div>
            <label>Ville</label>
            <input type="text" v-model="address.city" maxlength="100" />
          </div>
          <div>
            <label>Pays</label>
            <input type="text" v-model="address.country" maxlength="2" placeholder="FR" />
          </div>
          <div>
            <label>Téléphone <span class="optional">(facultatif)</span></label>
            <input type="tel" v-model="address.phone" maxlength="32" />
          </div>
        </div>
      </section>

      <section class="totals" v-if="selectedMethod">
        <div class="line">
          <span>Produit</span>
          <span>{{ formatAmount(productPrice) }}</span>
        </div>
        <div class="line">
          <span>Livraison</span>
          <span>{{ shippingCost === 0 ? 'Gratuit' : formatAmount(shippingCost) }}</span>
        </div>
        <div class="line total">
          <span>Total</span>
          <span>{{ formatAmount(totalAmount) }}</span>
        </div>
      </section>

      <div v-if="errorMessage" class="error">
        <i class="bi bi-exclamation-triangle"></i> {{ errorMessage }}
      </div>

      <div class="actions actions--column">
        <button
          class="btn-pay btn-pay--stripe"
          :disabled="!canSubmit || submitting"
          @click="submit('stripe')"
        >
          <span v-if="submitting && submittingMethod === 'stripe'">
            <i class="bi bi-arrow-repeat spin"></i> Redirection…
          </span>
          <span v-else>
            <i class="bi bi-credit-card"></i> Payer par carte (Stripe)
          </span>
        </button>
        <button
          class="btn-pay btn-pay--paypal"
          :disabled="!canSubmit || submitting"
          @click="submit('paypal')"
        >
          <span v-if="submitting && submittingMethod === 'paypal'">
            <i class="bi bi-arrow-repeat spin"></i> Redirection…
          </span>
          <span v-else>
            <i class="bi bi-paypal"></i> Payer avec PayPal
          </span>
        </button>
        <button class="btn-cancel" @click="cancel" :disabled="submitting">Annuler</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import AddressAutocomplete from './AddressAutocomplete.vue';
import paymentService, { type ShippingMethod, type ShippingAddressPayload, type InitPayPalPayload } from '@/services/payment.service';
import type { AddressResult } from '@/services/address.service';

interface ShippingOptionsLike {
  worldwide?: boolean;
  nationalOnly?: boolean;
  localPickup?: boolean;
  nationalCost?: number | null;
  worldwideCost?: number | null;
  /** legacy fallback */
  shippingCost?: number | null;
}

interface PaypalLikeResult {
  success: boolean;
  payment?: {
    id: string;
    paypalOrderId: string;
    approvalUrl?: string;
  };
}

interface StripeCheckoutResult {
  success: boolean;
  payment?: {
    id: string;
    stripeSessionId: string;
    checkoutUrl: string;
  };
}

type PaymentProvider = 'paypal' | 'stripe';

export default defineComponent({
  name: 'CheckoutDialog',
  components: { AddressAutocomplete },
  props: {
    productId: { type: [String, Number], required: true },
    productTitle: { type: String, required: true },
    productPrice: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    shippingOptions: { type: Object as PropType<ShippingOptionsLike>, required: true }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const submitting = ref(false);
    const submittingMethod = ref<PaymentProvider | ''>('');
    const errorMessage = ref('');

    const resolveCost = (method: ShippingMethod): number | null => {
      const opts = props.shippingOptions ?? {};
      if (method === 'localPickup') return 0;
      if (method === 'national') return opts.nationalCost ?? opts.shippingCost ?? null;
      if (method === 'worldwide') return opts.worldwideCost ?? opts.shippingCost ?? null;
      return null;
    };

    const availableMethods = computed(() => {
      const list: { value: ShippingMethod; label: string; cost: number }[] = [];
      const opts = props.shippingOptions ?? {};
      if (opts.nationalOnly) {
        const c = resolveCost('national');
        if (c !== null) list.push({ value: 'national', label: 'Livraison nationale', cost: c });
      }
      if (opts.worldwide) {
        const c = resolveCost('worldwide');
        if (c !== null) list.push({ value: 'worldwide', label: 'Livraison internationale', cost: c });
      }
      if (opts.localPickup) {
        list.push({ value: 'localPickup', label: 'Remise en main propre', cost: 0 });
      }
      return list;
    });

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

    const onAddressPicked = (r: AddressResult) => {
      address.value.streetLine1 = r.streetLine1;
      address.value.postalCode = r.postalCode;
      address.value.city = r.city;
      address.value.country = r.country;
    };

    const shippingCost = computed(() => {
      if (!selectedMethod.value) return 0;
      return resolveCost(selectedMethod.value as ShippingMethod) ?? 0;
    });

    const totalAmount = computed(() => {
      const product = Number(props.productPrice) || 0;
      return parseFloat((product + shippingCost.value).toFixed(2));
    });

    const formatAmount = (n: number) => {
      const formatter = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: props.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return formatter.format(n);
    };

    const isAddressFilled = computed(() => {
      const a = address.value;
      return Boolean(
        a.recipientName?.trim() &&
        a.streetLine1?.trim() &&
        a.postalCode?.trim() &&
        a.city?.trim() &&
        a.country?.trim()
      );
    });

    const canSubmit = computed(() => {
      if (!selectedMethod.value) return false;
      if (selectedMethod.value === 'localPickup') return true;
      return isAddressFilled.value;
    });

    const buildPayload = (): InitPayPalPayload => {
      const payload: InitPayPalPayload = {
        productId: props.productId,
        shippingMethod: selectedMethod.value as ShippingMethod
      };
      if (selectedMethod.value !== 'localPickup') {
        payload.shippingAddress = {
          recipientName: address.value.recipientName.trim(),
          streetLine1: address.value.streetLine1.trim(),
          streetLine2: address.value.streetLine2?.trim() || undefined,
          postalCode: address.value.postalCode.trim(),
          city: address.value.city.trim(),
          country: (address.value.country || 'FR').trim().toUpperCase(),
          phone: address.value.phone?.trim() || undefined
        };
      }
      return payload;
    };

    const submit = async (provider: PaymentProvider) => {
      if (!canSubmit.value || submitting.value) return;
      submitting.value = true;
      submittingMethod.value = provider;
      errorMessage.value = '';
      try {
        if (provider === 'stripe') {
          const result = (await paymentService.initStripeCheckout(buildPayload())) as StripeCheckoutResult;
          if (!result.success || !result.payment?.checkoutUrl) {
            errorMessage.value = 'Le paiement Stripe n\'a pas pu être initialisé.';
            return;
          }
          // Redirige direct vers Stripe Checkout (host page)
          window.location.href = result.payment.checkoutUrl;
          return;
        }

        const result = (await paymentService.initPayPal(buildPayload())) as PaypalLikeResult;
        if (!result.success || !result.payment) {
          errorMessage.value = 'Le paiement n\'a pas pu être initialisé.';
          return;
        }
        emit('confirm', result);
      } catch (err: any) {
        errorMessage.value =
          err?.response?.data?.message ||
          'Une erreur est survenue lors de l\'initialisation du paiement.';
      } finally {
        submitting.value = false;
        submittingMethod.value = '';
      }
    };

    const cancel = () => {
      if (submitting.value) return;
      emit('cancel');
    };

    return {
      submitting, submittingMethod, errorMessage, availableMethods, selectedMethod, address,
      shippingCost, totalAmount, canSubmit, formatAmount,
      onAddressPicked, submit, cancel
    };
  }
});
</script>

<style scoped lang="scss">
.checkout-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: var(--space-lg);
  animation: fadeIn 0.15s ease;
}

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

.section {
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
  padding: var(--space-md);
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
    background: rgba(255, 45, 120, 0.05);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);

  .full { grid-column: 1 / -1; }

  label {
    display: block;
    font-size: var(--font-size-xs);
    font-weight: 600;
    margin-bottom: var(--space-xs);
    color: var(--text-secondary);

    .optional {
      color: var(--text-muted);
      font-weight: 400;
    }
  }

  input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    box-sizing: border-box;

    &::placeholder { color: var(--text-muted); }

    &:focus {
      outline: none;
      border-color: var(--accent-pink);
      box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
    }
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
  border: 1px solid rgba(239, 68, 68, 0.2);
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
  gap: var(--space-md);
  justify-content: flex-end;

  &--column {
    flex-direction: column;
    gap: var(--space-sm);
  }
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

  &--stripe {
    background: #635bff;
    color: white;
  }

  &--paypal {
    background: #ffc439;
    color: #003087;
  }
}

.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 576px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
