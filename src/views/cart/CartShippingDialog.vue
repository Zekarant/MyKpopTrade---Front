<template>
  <div v-dismiss="() => emit('cancel')" class="popup-overlay">
    <div
      ref="dialog"
      class="cart-shipping"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <h2 :id="titleId" class="cart-shipping__title">Méthode de livraison</h2>
      <div class="cart-shipping__options" role="radiogroup" :aria-labelledby="titleId">
        <label v-for="option in SHIPPING_CHOICES" :key="option.value" class="cart-shipping__option">
          <input v-model="shippingMethod" type="radio" :value="option.value" />
          <i class="bi" :class="option.icon" aria-hidden="true"></i> {{ option.label }}
        </label>
      </div>

      <div v-if="shippingMethod !== 'localPickup'" class="cart-shipping__address">
        <input v-model="address.recipientName" type="text" placeholder="Nom du destinataire" aria-label="Nom du destinataire" class="cart-shipping__input" />
        <input v-model="address.streetLine1" type="text" placeholder="Adresse ligne 1" aria-label="Adresse ligne 1" class="cart-shipping__input" />
        <input v-model="address.streetLine2" type="text" placeholder="Adresse ligne 2 (optionnel)" aria-label="Adresse ligne 2 (optionnel)" class="cart-shipping__input" />
        <div class="cart-shipping__input-row">
          <input v-model="address.postalCode" type="text" :maxlength="POSTAL_CODE_MAX_LENGTH" placeholder="Code postal" aria-label="Code postal" class="cart-shipping__input" />
          <input v-model="address.city" type="text" placeholder="Ville" aria-label="Ville" class="cart-shipping__input" />
        </div>
        <input v-model.trim="address.country" type="text" maxlength="2" placeholder="FR" aria-label="Pays (code à deux lettres)" class="cart-shipping__input" />
        <input v-model="address.phone" type="text" placeholder="Téléphone (optionnel)" aria-label="Téléphone (optionnel)" class="cart-shipping__input" />
      </div>

      <div v-if="shipping.undeliverable.length" class="cart-alert" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        Non livrable avec ce mode : {{ shipping.undeliverable.join(', ') }}. Choisissez un autre mode ou retirez ces articles.
      </div>
      <dl v-else class="cart-shipping__recap">
        <div class="cart-shipping__recap-row">
          <dt>Articles</dt>
          <dd>{{ formatPrice(itemsTotal, currency) }}</dd>
        </div>
        <div class="cart-shipping__recap-row">
          <dt>Livraison</dt>
          <dd>{{ formatPrice(shipping.amount, currency) }}</dd>
        </div>
        <div class="cart-shipping__recap-row cart-shipping__recap-row--total">
          <dt>Total à payer</dt>
          <dd>{{ formatPrice(total, currency) }}</dd>
        </div>
      </dl>

      <div class="cart-shipping__actions">
        <button type="button" class="cart-btn cart-btn--outline" @click="emit('cancel')">Annuler</button>
        <button type="button" class="cart-btn cart-btn--primary" :disabled="submitting || shipping.undeliverable.length > 0" @click="confirm">
          {{ submitting ? 'Traitement...' : 'Confirmer & Payer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Choix de la livraison et de l'adresse avant le paiement du panier. */
import { computed, reactive, ref, useId } from 'vue';
import type { CartItem } from '@/services/cart.service';
import type cartService from '@/services/cart.service';
import type { ShippingMethod } from '@/services/payment.service';
import { func } from '@/function';
import { formatPrice } from '@/utils/format';
import { sumAmounts } from '@/utils/money';
import { POSTAL_CODE_MAX_LENGTH, isShippingAddressComplete, toShippingAddressPayload } from '@/utils/address';
import { useDialogFocus } from '@/composables/useDialogFocus';
import { cartShipping, sumCartItems } from './cartPricing';
import { vDismiss } from '@/composables/vDismiss';

export type CartCheckoutPayload = Parameters<typeof cartService.checkout>[0];

const props = defineProps<{
  items: CartItem[];
  /** Devise de référence du panier (celle du premier article). */
  currency: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [payload: CartCheckoutPayload];
}>();

const SHIPPING_CHOICES: { value: ShippingMethod; label: string; icon: string }[] = [
  { value: 'national', label: 'Nationale', icon: 'bi-geo-alt' },
  { value: 'worldwide', label: 'Mondiale', icon: 'bi-globe' },
  { value: 'localPickup', label: 'Main propre', icon: 'bi-hand-index' }
];

const dialog = ref<HTMLElement | null>(null);
// Focus sur la boîte elle-même (tabindex="-1") : le lecteur d'écran lit son titre d'abord.
useDialogFocus(dialog, dialog, () => emit('cancel'));
const titleId = `cart-shipping-title-${useId()}`;

const shippingMethod = ref<ShippingMethod>('national');
const address = reactive({
  recipientName: '',
  streetLine1: '',
  streetLine2: '',
  postalCode: '',
  city: '',
  // Code ISO à deux lettres, comme au paiement d'une annonce : le back refuse un nom de pays.
  country: 'FR',
  phone: ''
});

const itemsTotal = computed(() => sumCartItems(props.items));
const shipping = computed(() => cartShipping(props.items, shippingMethod.value));
const total = computed(() => sumAmounts([itemsTotal.value, shipping.value.amount]));

function confirm() {
  const needsAddress = shippingMethod.value !== 'localPickup';
  if (needsAddress && !isShippingAddressComplete(address)) {
    func.showToastError('Veuillez remplir les champs d\'adresse obligatoires.');
    return;
  }
  emit('confirm', {
    shippingMethod: shippingMethod.value,
    shippingAddress: needsAddress ? toShippingAddressPayload(address) : undefined
  });
}
</script>

<style lang="scss" scoped>
@use './cart-shared';

.cart-shipping {
  background: var(--bg-primary); border-radius: 16px; padding: 2rem;
  max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;

  &:focus { outline: none; }

  &__title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; }

  &__options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }

  &__option {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; border: 1px solid var(--surface-border);
    border-radius: 8px; cursor: pointer; transition: border-color 0.2s;

    &:has(input:checked) { border-color: var(--accent-purple); background: var(--accent-gradient-subtle); }
    input { accent-color: var(--accent-purple); }
  }

  &__address { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }

  &__input {
    padding: 0.75rem 1rem; border: 1px solid var(--surface-border);
    border-radius: 8px; font-size: 0.9rem; width: 100%;
    &:focus { outline: none; border-color: var(--accent-purple); }
  }

  &__input-row { display: flex; gap: 0.75rem; }

  &__recap {
    margin: 0 0 1.5rem; padding: 1rem; border-radius: 8px;
    background: var(--bg-secondary); font-size: 0.9rem;
  }

  &__recap-row {
    display: flex; justify-content: space-between;
    dt { font-weight: 400; }
    dd { margin: 0; }
    & + & { margin-top: 0.5rem; }

    &--total {
      padding-top: 0.5rem; border-top: 1px solid var(--surface-border);
      font-weight: 600; font-size: 1rem;
      dt { font-weight: 600; }
      dd { color: var(--accent-purple); }
    }
  }

  &__actions { display: flex; gap: 1rem; justify-content: flex-end; }
}
</style>
