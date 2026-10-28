<template>
  <PaymentModal
    title="Saisir l'expédition"
    subtitle="Renseignez le transporteur et le numéro de suivi."
    icon="bi bi-truck"
    @close="emit('close')"
  >
    <label :for="`${uid}-carrier`">Transporteur</label>
    <input :id="`${uid}-carrier`" v-model="carrier" type="text" placeholder="La Poste, Mondial Relay, Colissimo…" />

    <label :for="`${uid}-tracking`">Numéro de suivi</label>
    <input :id="`${uid}-tracking`" v-model="trackingNumber" type="text" placeholder="N° de tracking" />

    <label :for="`${uid}-url`">URL de suivi (optionnel)</label>
    <input :id="`${uid}-url`" v-model="trackingUrl" type="url" placeholder="https://…" />

    <template #confirm>
      <button type="button" class="btn btn-primary" :disabled="!carrier || !trackingNumber" @click="submit">Enregistrer</button>
    </template>
  </PaymentModal>
</template>

<script setup lang="ts">
/** Saisie de l'expédition d'une vente par le vendeur. */
import { ref, useId } from 'vue';
import PaymentModal from './PaymentModal.vue';
import type { ShipmentPayload } from './types';

const emit = defineEmits<{
  close: [];
  submit: [payload: ShipmentPayload];
}>();

const uid = `shipment-${useId()}`;
const carrier = ref('');
const trackingNumber = ref('');
const trackingUrl = ref('');

function submit() {
  emit('submit', {
    carrier: carrier.value,
    trackingNumber: trackingNumber.value,
    // URL facultative : un champ vide n'est pas envoyé.
    ...(trackingUrl.value ? { trackingUrl: trackingUrl.value } : {}),
  });
}
</script>
