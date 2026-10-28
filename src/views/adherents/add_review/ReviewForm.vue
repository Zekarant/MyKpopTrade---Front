<template>
  <form class="review-form" @submit.prevent="submitReview">
    <div class="form-group">
      <label id="rating-label">Note</label>
      <StarRatingInput v-model="formData.rating" labelledby="rating-label" />
    </div>

    <div class="form-group">
      <label for="review">Votre avis</label>
      <textarea
        id="review"
        v-model="formData.review"
        placeholder="Décrivez votre expérience avec ce vendeur..."
        required
        :minlength="MIN_REVIEW_LENGTH"
        :maxlength="MAX_REVIEW_LENGTH"
        class="review-textarea"
      ></textarea>
      <div class="char-count">
        {{ formData.review.length }}/{{ MAX_REVIEW_LENGTH }}
      </div>
    </div>

    <ReviewImagesField :images="images" :error="imageError" @add="addFiles" @remove="removeImage" />

    <div v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="success-message" role="status">
      {{ successMessage }}
    </div>

    <div class="form-actions">
      <button type="submit" class="btn-submit" :disabled="isSubmitting">
        <span v-if="!isSubmitting">Soumettre l'avis</span>
        <span v-else>Envoi en cours...</span>
      </button>
      <router-link to="/adherents/dashboard" class="btn-cancel">
        Annuler
      </router-link>
    </div>
  </form>
</template>

<script setup lang="ts">
/** Formulaire d'avis sur un vendeur : note, texte et photos, puis envoi. */
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import reviewService from '@/services/review.service';
import type { ReviewData } from '@/types/review.types';
import StarRatingInput from '@/components/StarRatingInput.vue';
import { useImageUpload } from '@/composables/useImageUpload';
import ReviewImagesField from './ReviewImagesField.vue';

const props = defineProps<{
  transactionId: string;
  recipientId: string;
  /** Erreur du chargement du produit, affichée jusqu'au premier envoi. */
  initialError?: string;
}>();

const MIN_REVIEW_LENGTH = 10;
const MAX_REVIEW_LENGTH = 1000;
const MAX_REVIEW_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Laisse le temps de lire la confirmation avant de quitter la page. */
const REDIRECT_DELAY_MS = 2000;

const router = useRouter();

const isSubmitting = ref(false);
const errorMessage = ref(props.initialError ?? '');
const successMessage = ref('');

const formData = ref<ReviewData>({
  transactionId: props.transactionId,
  recipientId: props.recipientId,
  rating: 5,
  review: '',
  type: 'seller',
});

const { images, error: imageError, addFiles, removeImage } = useImageUpload({
  maxFiles: MAX_REVIEW_IMAGES,
  tooManyMessage: (count) =>
    `Vous ne pouvez télécharger que ${MAX_REVIEW_IMAGES} images maximum (actuellement ${count} images sélectionnées)`,
  rejectReason: (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Type de fichier non supporté: ${file.name}. Veuillez utiliser JPG, PNG ou WebP.`;
    }
    return file.size > MAX_IMAGE_BYTES ? `${file.name} est trop volumineux (max 5 Mo).` : null;
  },
});

/** Message bloquant l'envoi, ou `null` si l'avis peut partir. */
function validationError(data: ReviewData): string | null {
  if (!data.transactionId) return 'ID de la transaction manquant';
  if (!data.recipientId) return 'ID du vendeur manquant';
  if (data.rating < 1 || data.rating > 5) return 'Veuillez sélectionner une note entre 1 et 5';
  if (data.review.trim().length < MIN_REVIEW_LENGTH) return 'Votre avis doit contenir au moins 10 caractères';
  return null;
}

async function submitReview() {
  const invalid = validationError(formData.value);
  if (invalid) {
    errorMessage.value = invalid;
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const files = images.value.map((image) => image.source).filter((source): source is File => source instanceof File);
    if (files.length > 0) {
      formData.value.ratingImages = files;
    }

    await reviewService.submitReview(formData.value);
    successMessage.value = 'Votre avis a été envoyé avec succès!';
    setTimeout(() => {
      router.push('/adherents/dashboard');
    }, REDIRECT_DELAY_MS);
  } catch (error) {
    const err = error as Record<string, unknown>;
    errorMessage.value = (err.message as string) || 'Une erreur est survenue lors de l\'envoi de votre avis';
    console.error('Erreur:', error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.review-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary-color);
  }
}

.review-textarea {
  border: 1px solid var(--secondary-color-tint);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
  transition: border-color 0.3s ease;
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(23, 32, 42, 0.1);
  }

  &::placeholder {
    color: var(--secondary-color);
  }
}

.char-count {
  font-size: 12px;
  color: var(--secondary-color);
  text-align: right;
}

.error-message {
  padding: 12px;
  background-color: rgba(183, 58, 78, 0.1);
  border: 1px solid var(--danger-color);
  border-radius: 8px;
  color: var(--danger-color);
  font-size: 14px;
}

.success-message {
  padding: 12px;
  background-color: rgba(61, 204, 106, 0.1);
  border: 1px solid var(--success-color);
  border-radius: 8px;
  color: var(--success-color);
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-submit,
.btn-cancel {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
}

.btn-submit {
  background-color: var(--primary-color);
  color: white;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-ligh);
    box-shadow: 0 4px 8px rgba(23, 32, 42, 0.3);
  }

  &:disabled {
    background-color: var(--secondary-color-tint);
    cursor: not-allowed;
    color: var(--secondary-color);
  }
}

.btn-cancel {
  background-color: var(--light-color);
  color: var(--primary-color);
  border: 1px solid var(--secondary-color-tint);

  &:hover {
    background-color: var(--secondary-color-tint);
  }
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>
