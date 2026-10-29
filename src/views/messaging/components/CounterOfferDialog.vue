<template>
  <div v-dismiss="() => emit('cancel')" class="popup-overlay">
    <div ref="dialogEl" class="counter-popup-content" role="dialog" aria-modal="true" aria-labelledby="counter-offer-title">
      <button type="button" class="counter-close-btn" aria-label="Fermer" @click="emit('cancel')">
        <i class="bi bi-x-lg"></i>
      </button>
      <h3 id="counter-offer-title" class="counter-popup-title">Faire une contre-offre</h3>
      <p class="counter-popup-message">Souhaitez-vous proposer une contre-offre ?</p>
      <input
        v-model.number="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="Entrez votre montant"
        aria-label="Montant de la contre-offre"
        class="counter-input"
      />
      <textarea
        v-model="message"
        placeholder="Message optionnel"
        aria-label="Message accompagnant la contre-offre"
        class="counter-input counter-textarea"
      ></textarea>
      <div class="counter-popup-actions">
        <button type="button" class="btn-outline btn-wide" @click="emit('cancel')">Annuler</button>
        <button type="button" class="btn-danger btn-wide" :disabled="!amount || submitting" @click="submit">
          {{ submitting ? 'Envoi...' : 'Envoyer' }}
        </button>
      </div>
      <p v-if="localError || error" class="counter-error" role="alert">
        {{ localError || error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Contre-offre du vendeur : montant obligatoire, message facultatif. */
import { ref } from 'vue'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { vDismiss } from '@/composables/vDismiss'

defineProps<{
  submitting: boolean
  /** Refus de l'API, affiché sous les boutons. */
  error: string
}>()

const emit = defineEmits<{
  submit: [amount: number, message: string]
  cancel: []
}>()

const dialogEl = ref<HTMLElement | null>(null)
useDialogFocus(dialogEl, undefined, () => emit('cancel'))

const amount = ref<number | null>(null)
const message = ref('')
const localError = ref('')

function submit(): void {
  if (!amount.value || amount.value <= 0) {
    localError.value = 'Montant requis et doit être supérieur à 0.'
    return
  }
  localError.value = ''
  emit('submit', amount.value, message.value)
}
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/counter_offer_dialog.scss';
</style>
