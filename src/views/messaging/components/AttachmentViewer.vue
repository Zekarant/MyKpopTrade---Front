<template>
  <div v-dismiss="() => emit('close')" class="popup-overlay">
    <div ref="dialogEl" class="popup-content attachment-viewer" role="dialog" aria-modal="true" aria-label="Pièces jointes">
      <button type="button" class="close-btn" aria-label="Fermer" @click="emit('close')">&times;</button>
      <ImageCarousel class="screen" :predefined-index="index" :images="images" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
/** Visionneuse plein écran des images d'un message ou d'une conversation. */
import ImageCarousel from '@/components/ImageCarousel.vue'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { vDismiss } from '@/composables/vDismiss'

defineProps<{ images: string[]; index: number }>()

const emit = defineEmits<{ close: [] }>()

const dialogEl = ref<HTMLElement | null>(null)
useDialogFocus(dialogEl, undefined, () => emit('close'))
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/attachment_viewer.scss';
</style>
