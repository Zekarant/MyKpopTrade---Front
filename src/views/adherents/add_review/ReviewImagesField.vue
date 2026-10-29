<template>
  <div class="form-group">
    <label for="images">Photos (optionnel)</label>
    <div
      class="drop-zone"
      :class="{ dragging: isDragging }"
      role="button"
      tabindex="0"
      aria-describedby="review-images-hint"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @keydown.space.prevent="openFilePicker"
    >
      <input
        id="images"
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="file-input"
        @change="onInputChange"
      />
      <div class="drop-zone-content">
        <i class="bi bi-cloud-arrow-up"></i>
        <p>Glissez vos photos ici ou <span class="link">cliquez pour sélectionner</span></p>
        <span id="review-images-hint" class="file-hint">JPG, PNG ou WebP (max 5 Mo par fichier, max 5 fichiers)</span>
      </div>
    </div>

    <div v-if="images.length > 0" class="image-preview-gallery">
      <div v-for="(image, index) in images" :key="image.id" class="preview-item">
        <img v-if="image.preview" :src="image.preview" :alt="`Photo ${index + 1}`" />
        <button
          type="button"
          class="remove-btn"
          title="Supprimer cette image"
          :aria-label="`Supprimer la photo ${index + 1}`"
          @click="emit('remove', image.id)"
        >
          <i class="bi bi-x-circle-fill"></i>
        </button>
      </div>
    </div>

    <div v-if="error" class="image-error" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
/** Photos jointes à un avis : zone de dépôt, aperçus et retrait. */
import { useFileDropZone } from '@/composables/useFileDropZone';
import type { UploadedImage } from '@/composables/useImageUpload';

defineProps<{
  images: UploadedImage[];
  error: string;
}>();

const emit = defineEmits<{
  add: [files: FileList | null | undefined];
  remove: [id: number];
}>();

const { isDragging, fileInput, openFilePicker, onDragOver, onDragLeave, onDrop, onInputChange } =
  useFileDropZone((files) => emit('add', files));
</script>

<style scoped lang="scss">
// La mise en page de `.form-group` vient du formulaire parent (racine du
// composant) ; son libellé, lui, n'est pas atteint par le style scopé du parent.
label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.drop-zone {
  border: 2px dashed var(--surface-border);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: color-mix(in srgb, var(--text-secondary) 2%, transparent);

  &:hover {
    border-color: var(--text-primary);
    background-color: color-mix(in srgb, var(--text-primary) 2%, transparent);
  }

  &.dragging {
    border-color: var(--text-primary);
    background-color: color-mix(in srgb, var(--text-primary) 10%, transparent);
    transform: scale(1.02);
  }

  .file-input {
    display: none;
  }

  .drop-zone-content {
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;

    i {
      font-size: 40px;
      color: var(--text-primary);
    }

    p {
      font-size: 14px;
      color: var(--text-primary);
      margin: 0;
      font-weight: 500;

      .link {
        color: var(--text-secondary);
        text-decoration: underline;
      }
    }

    .file-hint {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
}

.image-preview-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 20px;

  .preview-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--bg-secondary);
    aspect-ratio: 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 0;
      color: var(--text-on-accent);
      font-size: 16px;

      &:hover {
        background: color-mix(in srgb, var(--danger) 90%, transparent);
        transform: scale(1.1);
      }
    }
  }
}

.image-error {
  padding: 10px;
  background-color: var(--danger-light);
  border: 1px solid var(--danger);
  border-radius: 6px;
  color: var(--danger-text);
  font-size: 12px;
  margin-top: 8px;
}
</style>
