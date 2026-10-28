<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div ref="dialog" class="modal-card" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="subtitleId">
      <h2 :id="titleId"><i :class="icon"></i> {{ title }}</h2>
      <p :id="subtitleId" class="modal-subtitle">{{ subtitle }}</p>

      <slot />

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Annuler</button>
        <slot name="confirm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Cadre commun des modales de « Mes paiements » : boîte de dialogue
 * accessible, fermée par Échap, clic sur le fond ou « Annuler ».
 */
import { ref, useId } from 'vue';
import { useDialogFocus } from '@/composables/useDialogFocus';

defineProps<{
  title: string;
  subtitle: string;
  /** Classes Bootstrap Icons de l'icône du titre. */
  icon: string;
}>();

const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLElement | null>(null);
const titleId = `payment-modal-title-${useId()}`;
const subtitleId = `payment-modal-subtitle-${useId()}`;

useDialogFocus(dialog, undefined, () => emit('close'));
</script>
