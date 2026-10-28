<template>
  <div class="popup-overlay" @click="emit('cancel')" @keydown.esc="emit('cancel')">
    <div
      ref="dialog"
      class="popup-content"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="textId"
      @click.stop
    >
      <p :id="textId">Voulez-vous vraiment supprimer votre photo ?</p>
      <div class="popup-buttons-footer">
        <button ref="cancelButton" type="button" class="btn btn-primary-outline" @click="emit('cancel')">Annuler</button>
        <button type="button" class="btn btn-danger" @click="emit('confirm')">Supprimer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Confirmation de suppression de la bannière ou de la photo de profil. */
import { ref, useId } from 'vue';
import { useDialogFocus } from '@/composables/useDialogFocus';

const emit = defineEmits<{ cancel: []; confirm: [] }>();

const dialog = ref<HTMLElement | null>(null);
const cancelButton = ref<HTMLElement | null>(null);
const textId = `confirm-delete-${useId()}`;

// Annuler par défaut : une validation au clavier ne doit pas supprimer par mégarde.
useDialogFocus(dialog, cancelButton);
</script>

<style lang="scss" scoped>
.btn {
  border-radius: 2px;
  width: 100%;
}
</style>
