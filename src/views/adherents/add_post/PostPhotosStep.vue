<template>
  <fieldset class="form-section">
    <legend><i class="bi bi-images"></i> Photos</legend>
    <p class="form-intro">
      La première photo sert de vignette. Montrez l'article sous plusieurs angles,
      ainsi que ses défauts éventuels : c'est ce qui évite la plupart des litiges.
    </p>
    <div
      v-if="images.length === 0"
      class="image-drop-zone"
      :class="{ 'drag-over': isDragging }"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @keydown.space.prevent="openFilePicker"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <i class="bi bi-cloud-arrow-up drop-icon"></i>
      <span class="drop-text">Glissez vos photos ici</span>
      <span class="drop-hint">ou cliquez pour parcourir</span>
    </div>
    <!-- Pas de rôle bouton ici : la zone contient déjà des boutons ; au clavier, « + » ouvre le sélecteur. -->
    <div
      v-else
      class="image-preview-container"
      :class="{ 'drag-over': isDragging }"
      @click="openFilePicker"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <swiper
        class="image-swiper"
        :slides-per-view="5"
        :breakpoints="{
          0: { slidesPerView: 2 },
          720: { slidesPerView: 3 },
          980: { slidesPerView: 4 }
        }"
      >
        <swiper-slide v-for="(image, index) in images" :key="image.id">
          <div class="image-preview">
            <img v-if="image.preview" class="imgcenter" :src="image.preview" :alt="`Photo ${index + 1}`" />
            <span v-if="index === 0" class="image-preview__badge">Vignette</span>
            <button
              type="button"
              class="delete_img"
              :aria-label="`Retirer la photo ${index + 1}`"
              @click.stop="emit('remove', image.id)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </swiper-slide>
        <swiper-slide v-if="images.length < maxImages" class="add-image-slide">
          <button style="height: 100%; margin-left: 10px;" class="btn-primary" type="button" aria-label="Ajouter des photos">+</button>
        </swiper-slide>
      </swiper>
    </div>
    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onInputChange" />
    <small class="form-hint">{{ images.length }}/{{ maxImages }} photos · JPG, PNG</small>
  </fieldset>
</template>

<script setup lang="ts">
/** Étape « Photos » de la vente : dépôt, aperçu et retrait des photos. */
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/navigation';
import { useFileDropZone } from '@/composables/useFileDropZone';
import type { UploadedImage } from '@/composables/useImageUpload';

defineProps<{
  images: UploadedImage[];
  maxImages: number;
}>();

const emit = defineEmits<{
  add: [files: FileList | null | undefined];
  remove: [id: number];
}>();

const { isDragging, fileInput, openFilePicker, onDragOver, onDragLeave, onDrop, onInputChange } =
  useFileDropZone((files) => emit('add', files));
</script>
