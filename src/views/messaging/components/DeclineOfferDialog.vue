<template>
  <div class="popup-overlay">
    <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="decline-offer-title">
      <h3 id="decline-offer-title" class="popup-title">Refuser l'offre</h3>
      <p class="popup-message">Êtes-vous sûr de vouloir refuser cette offre ?</p>
      <textarea
        v-model="message"
        class="popup-textarea"
        aria-label="Message de refus"
        placeholder="Ajouter un message (optionnel)"
      ></textarea>
      <div class="popup-actions">
        <button type="button" class="btn-outline" @click="emit('cancel')">Annuler</button>
        <button type="button" class="btn-danger" @click="emit('confirm', message)">Refuser</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Confirmation du refus d'une offre, avec un message facultatif pour l'acheteur. */
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [message: string]
  cancel: []
}>()

const message = ref('')
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/decline_offer_dialog.scss';
</style>
