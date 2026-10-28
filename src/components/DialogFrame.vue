<template>
  <div ref="frame" role="dialog" aria-modal="true" tabindex="-1">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Cadre d'une boîte de dialogue écrite dans une page (`v-if`) : rôle, focus
 * gardé dedans, Escape qui émet `close`. Les classes passent sur le cadre.
 *
 *   <DialogFrame v-if="open" class="modal-card" aria-labelledby="titre" @close="open = false">…</DialogFrame>
 */
import { ref } from 'vue';
import { useDialogFocus } from '@/composables/useDialogFocus';

const emit = defineEmits<{ close: [] }>();

const frame = ref<HTMLElement | null>(null);
useDialogFocus(frame, undefined, () => emit('close'));
</script>
