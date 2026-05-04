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

      <div class="actions">
        <button class="btn-cancel" @click="cancel" :disabled="submitting">Annuler</button>
        <button
          class="btn-submit"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          <span v-if="submitting"><i class="bi bi-arrow-repeat spin"></i> En cours…</span>
          <span v-else>Confirmer et payer</span>
        </button>
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

    const submit = async () => {
      if (!canSubmit.value || submitting.value) return;
      submitting.value = true;
      errorMessage.value = '';
      try {
        const result = await paymentService.initPayPal(buildPayload()) as PaypalLikeResult;
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
      }
    };

    const cancel = () => {
      if (submitting.value) return;
      emit('cancel');
    };

    return {
      submitting, errorMessage, availableMethods, selectedMethod, address,
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
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 16px;
}
.checkout-modal {
  background: white;
  border-radius: 12px;
  max-width: 540px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
}
.close-btn:hover { color: #000; }

h2 {
  margin: 0 0 16px;
  font-size: 1.3em;
}
h3 {
  margin: 0 0 8px;
  font-size: 1em;
  color: #333;
}

.product-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f7f7;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.product-summary .price {
  font-weight: 600;
}

.section {
  margin-bottom: 20px;
}
.section .empty {
  font-size: 0.9em;
  color: #999;
  font-style: italic;
}

.method-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  gap: 10px;
}
.method-option.selected {
  border-color: #4a7bff;
  background: #f0f5ff;
}
.method-option input {
  margin: 0;
}
.method-option .method-label {
  flex: 1;
}
.method-option .method-cost {
  font-weight: 500;
  color: #333;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.form-grid .full {
  grid-column: 1 / -1;
}
.form-grid label {
  display: block;
  font-size: 0.9em;
  margin-bottom: 4px;
  color: #555;
}
.form-grid label .optional {
  color: #999;
  font-weight: normal;
}
.form-grid input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95em;
  box-sizing: border-box;
}

.totals {
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-bottom: 16px;
}
.totals .line {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  color: #555;
}
.totals .line.total {
  border-top: 1px solid #eee;
  margin-top: 6px;
  padding-top: 8px;
  font-weight: 600;
  color: #000;
  font-size: 1.05em;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px;
  color: #b91c1c;
  font-size: 0.9em;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.btn-cancel,
.btn-submit {
  padding: 10px 18px;
  border-radius: 6px;
  border: none;
  font-size: 0.95em;
  cursor: pointer;
}
.btn-cancel {
  background: #eee;
  color: #333;
}
.btn-submit {
  background: #4a7bff;
  color: white;
  font-weight: 500;
}
.btn-submit:disabled {
  background: #b5c5ee;
  cursor: not-allowed;
}
.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
