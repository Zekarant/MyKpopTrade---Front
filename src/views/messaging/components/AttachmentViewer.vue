<template>
  <div class="popup-overlay" @click.self="emit('close')">
    <div class="popup-content attachment-viewer" role="dialog" aria-modal="true" aria-label="Pièces jointes">
      <button type="button" class="close-btn" aria-label="Fermer" @click="emit('close')">&times;</button>
      <ImageCarousel class="screen" :predefined-index="index" :images="images" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Visionneuse plein écran des images d'un message ou d'une conversation. */
import ImageCarousel from '@/components/ImageCarousel.vue'

defineProps<{ images: string[]; index: number }>()

const emit = defineEmits<{ close: [] }>()
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/attachment_viewer.scss';
</style>
