<template>
  <PaymentModal
    title="Ouvrir un litige"
    subtitle="Décrivez précisément le problème. L'autre partie sera notifiée."
    icon="bi bi-shield-exclamation"
    @close="emit('close')"
  >
    <label :for="`${uid}-reason`">Motif</label>
    <select :id="`${uid}-reason`" v-model="reason">
      <option v-for="option in DISPUTE_REASONS" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>

    <label :for="`${uid}-description`">Description (max 2000 caractères)</label>
    <textarea :id="`${uid}-description`" v-model="description" rows="5" maxlength="2000" placeholder="Donnez tous les détails utiles..."></textarea>

    <template #confirm>
      <button type="button" class="btn btn-danger" :disabled="!description.trim()" @click="emit('submit', { reason, description })">
        Ouvrir le litige
      </button>
    </template>
  </PaymentModal>
</template>

<script setup lang="ts">
/** Ouverture d'un litige sur un paiement, par l'acheteur ou le vendeur. */
import { ref, useId } from 'vue';
import type { DisputeReason } from '@/services/dispute.service';
import PaymentModal from './PaymentModal.vue';

const DISPUTE_REASONS: { value: DisputeReason; label: string }[] = [
  { value: 'not_received', label: 'Colis non reçu' },
  { value: 'damaged', label: 'Colis endommagé' },
  { value: 'not_as_described', label: 'Produit non conforme à la description' },
  { value: 'counterfeit', label: 'Contrefaçon' },
  { value: 'wrong_item', label: 'Mauvais article' },
  { value: 'partial_delivery', label: 'Livraison partielle' },
  { value: 'seller_unresponsive', label: 'Vendeur ne répond pas' },
  { value: 'buyer_abuse', label: 'Comportement abusif de l\'acheteur' },
  { value: 'other', label: 'Autre' },
];

const emit = defineEmits<{
  close: [];
  submit: [payload: { reason: DisputeReason; description: string }];
}>();

const uid = `dispute-${useId()}`;
const reason = ref<DisputeReason>('not_received');
const description = ref('');
</script>
