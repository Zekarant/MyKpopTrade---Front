<template>
  <PaymentModal
    title="Rembourser l'acheteur"
    subtitle="L'acheteur sera remboursé via PayPal et notifié automatiquement."
    icon="bi bi-arrow-counterclockwise"
    @close="emit('close')"
  >
    <p class="modal-info">
      Restant remboursable : <strong>{{ formattedMax }}</strong>
    </p>

    <label :for="`${uid}-reason`">Raison</label>
    <textarea :id="`${uid}-reason`" v-model="reason" rows="3" placeholder="Pourquoi remboursez-vous ?"></textarea>

    <label :for="`${uid}-amount`">Montant (laisser vide pour rembourser le restant : {{ formattedMax }})</label>
    <input
      :id="`${uid}-amount`"
      v-model.number="amount"
      type="number"
      min="0.01"
      :max="maxAmount"
      step="0.01"
      :placeholder="`max ${maxAmount}`"
      :aria-invalid="Boolean(amountError)"
      :aria-describedby="amountError ? `${uid}-amount-error` : undefined"
    />
    <small v-if="amountError" :id="`${uid}-amount-error`" class="modal-error">{{ amountError }}</small>

    <label :for="`${uid}-password`">Mot de passe (confirmation)</label>
    <input :id="`${uid}-password`" v-model="password" type="password" placeholder="Votre mot de passe" />

    <template #confirm>
      <button type="button" class="btn btn-danger" :disabled="!canSubmit" @click="submit">Confirmer le remboursement</button>
    </template>
  </PaymentModal>
</template>

<script setup lang="ts">
/** Remboursement (total ou partiel) d'un paiement par le vendeur, confirmé par mot de passe. */
import { computed, ref, useId } from 'vue';
import { formatPrice } from '@/utils/format';
import { fromCents, toCents } from '@/utils/money';
import PaymentModal from './PaymentModal.vue';
import type { RefundPayload } from './types';

const props = defineProps<{
  /** Restant remboursable, dans la devise du paiement. */
  maxAmount: number;
  currency: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [payload: RefundPayload];
}>();

const uid = `refund-${useId()}`;
const reason = ref('');
/** `''` : champ vidé (`v-model.number` rend alors une chaîne). */
const amount = ref<number | ''>('');
const password = ref('');

const formattedMax = computed(() => formatPrice(props.maxAmount, props.currency));

const amountError = computed(() => {
  const value = amount.value;
  if (value === '') return '';
  // Moins d'un centime : le montant serait arrondi à zéro.
  if (!Number.isFinite(value) || toCents(value) <= 0) return 'Montant invalide';
  if (toCents(value) > toCents(props.maxAmount)) {
    return `Le montant dépasse le restant remboursable (${props.maxAmount})`;
  }
  return '';
});

const canSubmit = computed(() => Boolean(reason.value.trim() && password.value && !amountError.value));

function submit() {
  const payload: RefundPayload = { reason: reason.value, password: password.value };
  // Arrondi au centime : la saisie « 12.345 » ne part pas telle quelle.
  if (amount.value !== '') payload.amount = fromCents(toCents(amount.value));
  emit('submit', payload);
}
</script>
