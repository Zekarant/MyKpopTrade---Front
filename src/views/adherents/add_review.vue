<template>
  <nav_bar></nav_bar>
  <div class="add-review-container">
    <div class="add-review-content">
      <h1>Ajouter un avis</h1>

      <div v-if="loading" class="loading">
        <p>Chargement...</p>
      </div>

      <div v-else>
        <!-- Product Display -->
        <div v-if="product" class="product-display">
          <div class="product-image">
            <img 
              v-if="product" 
              :src="`${apiUrl}${product.images[0]}`" 
              :alt="product.title" 
            />
          </div>
          <div class="product-info">
            <h2>{{ product.title }}</h2>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-meta">
              <span class="price">{{ product.price }} {{ product.currency }}</span>
              <span class="condition">{{ product.condition }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="submitReview" class="review-form">
          <!-- Rating -->
          <div class="form-group">
            <label for="rating">Note</label>
            <div class="rating-selector">
              <div class="stars">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  class="star-btn"
                  :class="{ active: star <= formData.rating }"
                  @click="formData.rating = star"
                >
                  <i class="bi bi-star-fill"></i>
                </button>
              </div>
              <span class="rating-text">{{ formData.rating }}/5</span>
            </div>
          </div>

          <!-- Review Text -->
          <div class="form-group">
            <label for="review">Votre avis</label>
            <textarea
              id="review"
              v-model="formData.review"
              placeholder="Décrivez votre expérience avec ce vendeur..."
              required
              minlength="10"
              maxlength="1000"
              class="review-textarea"
            ></textarea>
            <div class="char-count">
              {{ formData.review.length }}/1000
            </div>
          </div>

          <!-- Image Upload -->
          <div class="form-group">
            <label for="images">Photos (optionnel)</label>
            <div 
              class="drop-zone"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
              @click="fileInput?.click()"
              :class="{ dragging: isDragging }"
            >
              <input
                ref="fileInput"
                id="images"
                type="file"
                multiple
                accept="image/*"
                @change="handleFileSelect"
                class="file-input"
              />
              <div class="drop-zone-content">
                <i class="bi bi-cloud-arrow-up"></i>
                <p>Glissez vos photos ici ou <span class="link">cliquez pour sélectionner</span></p>
                <span class="file-hint">JPG, PNG ou WebP (max 5 Mo par fichier, max 5 fichiers)</span>
              </div>
            </div>

            <!-- Image Preview Gallery -->
            <div v-if="selectedImages.length > 0" class="image-preview-gallery">
              <div v-for="(image, index) in selectedImages" :key="index" class="preview-item">
                <img :src="image.preview" :alt="`Preview ${index + 1}`" />
                <button 
                  type="button" 
                  class="remove-btn" 
                  @click="removeImage(index)"
                  title="Supprimer cette image"
                >
                  <i class="bi bi-x-circle-fill"></i>
                </button>
              </div>
            </div>

            <div v-if="imageError" class="image-error">
              {{ imageError }}
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <!-- Submit Button -->
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import nav_bar from '@/components/adherents/nav_bar.vue';
import reviewService from '@/services/review.service';
import postService from '@/services/post.service';
import type { ReviewData } from '@/types/review.types';
import type { Post } from '@/types/post.types';

const route = useRoute();
const router = useRouter();

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const loading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const product = ref<Post | null>(null);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement>();
const imageError = ref('');

interface ImageFile {
  file: File;
  preview: string;
}

const selectedImages = ref<ImageFile[]>([]);

const formData = ref<ReviewData>({
  transactionId: '',
  recipientId: '',
  rating: 5,
  review: '',
  type: 'seller',
});

// Fonction pour extraire l'ID du vendeur
const getSellerId = (seller: string | unknown): string => {
  if (typeof seller === 'string') {
    return seller;
  }
  if (seller && typeof seller === 'object' && '_id' in seller) {
    return (seller as Record<string, unknown>)._id as string;
  }
  if (Array.isArray(seller) && seller.length > 0) {
    const firstSeller = seller[0] as Record<string, unknown>;
    return (firstSeller._id as string) || '';
  }
  return '';
};

// Valider les fichiers images
const validateImages = (files: File[]): boolean => {
  imageError.value = '';
  const maxFileSize = 5 * 1024 * 1024; // 5 Mo
  const maxFiles = 5;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // Vérifier le nombre total de fichiers
  if (selectedImages.value.length + files.length > maxFiles) {
    imageError.value = `Vous ne pouvez télécharger que ${maxFiles} images maximum (actuellement ${selectedImages.value.length} images sélectionnées)`;
    return false;
  }

  // Valider chaque fichier
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      imageError.value = `Type de fichier non supporté: ${file.name}. Veuillez utiliser JPG, PNG ou WebP.`;
      return false;
    }
    if (file.size > maxFileSize) {
      imageError.value = `${file.name} est trop volumineux (max 5 Mo).`;
      return false;
    }
  }

  return true;
};

// Gérer la sélection de fichiers
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  
  if (validateImages(files)) {
    addImages(files);
  }
  
  // Réinitialiser l'input
  if (target) {
    target.value = '';
  }
};

// Gérer le drop zone
const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  
  if (validateImages(imageFiles)) {
    addImages(imageFiles);
  }
};

// Ajouter les images à la liste
const addImages = (files: File[]) => {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImages.value.push({
        file: file,
        preview: (e.target?.result as string) || '',
      });
    };
    reader.readAsDataURL(file);
  });
};

// Supprimer une image
const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1);
};

onMounted(async () => {
  // Récupérer l'ID du produit depuis l'URL
  const productId = route.params.id as string;
  if (productId) {
    // Récupérer les informations du produit
    try {
      const response = await postService.getPost(productId);
      product.value = response.product;
      // Utiliser l'ID du produit comme transactionId
      formData.value.transactionId = productId;
      // Utiliser l'ID du vendeur comme recipientId
      formData.value.recipientId = getSellerId(response.product.seller);
    } catch (error) {
      const err = error as Record<string, unknown>;
      errorMessage.value = (err.message as string) || 'Erreur lors du chargement du produit';
      console.error('Erreur:', error);
    }
  } else {
    errorMessage.value = 'ID du produit manquant';
  }
  loading.value = false;
});

const submitReview = async () => {
  // Valider les données
  if (!formData.value.transactionId) {
    errorMessage.value = 'ID de la transaction manquant';
    return;
  }

  if (!formData.value.recipientId) {
    errorMessage.value = 'ID du vendeur manquant';
    return;
  }

  if (formData.value.rating < 1 || formData.value.rating > 5) {
    errorMessage.value = 'Veuillez sélectionner une note entre 1 et 5';
    return;
  }

  if (formData.value.review.trim().length < 10) {
    errorMessage.value = 'Votre avis doit contenir au moins 10 caractères';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    // Ajouter les fichiers images à formData
    if (selectedImages.value.length > 0) {
      formData.value.ratingImages = selectedImages.value.map(img => img.file);
    }

    await reviewService.submitReview(formData.value);
    successMessage.value = 'Votre avis a été envoyé avec succès!';
    
    // Rediriger après 2 secondes
    setTimeout(() => {
      router.push('/adherents/dashboard');
    }, 2000);
  } catch (error) {
    const err = error as Record<string, unknown>;
    errorMessage.value = (err.message as string) || 'Une erreur est survenue lors de l\'envoi de votre avis';
    console.error('Erreur:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.add-review-container {
  min-height: calc(100vh - 60px);
  padding: 40px 20px;
  background: linear-gradient(135deg, var(--light-color) 0%, white 100%);
}

.add-review-content {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 30px;
    text-align: center;
  }
}

// Product Display Section
.product-display {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--secondary-color-tint);

  .product-image {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--light-color);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-color);
      margin: 0;
      line-height: 1.4;
      max-height: 2.8em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-description {
      font-size: 13px;
      color: var(--secondary-color);
      margin: 0;
      line-height: 1.4;
      max-height: 2.6em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 4px;

      .price {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-color);
      }

      .condition {
        font-size: 12px;
        color: white;
        background-color: var(--secondary-color);
        padding: 2px 8px;
        border-radius: 4px;
      }
    }
  }
}

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

.rating-selector {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;

  .stars {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .star-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 32px;
    color: var(--secondary-color-tint);
    transition: all 0.3s ease;
    padding: 0;

    &:hover,
    &.active {
      color: var(--primary-color);
      transform: scale(1.2);
    }
  }

  .rating-text {
    font-size: 14px;
    color: var(--secondary-color);
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

// Drop Zone Styles
.drop-zone {
  border: 2px dashed var(--secondary-color-tint);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(108, 117, 125, 0.02);

  &:hover {
    border-color: var(--primary-color);
    background-color: rgba(23, 32, 42, 0.02);
  }

  &.dragging {
    border-color: var(--primary-color);
    background-color: rgba(23, 32, 42, 0.1);
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
      color: var(--primary-color);
    }

    p {
      font-size: 14px;
      color: var(--primary-color);
      margin: 0;
      font-weight: 500;

      .link {
        color: var(--secondary-color);
        text-decoration: underline;
      }
    }

    .file-hint {
      font-size: 12px;
      color: var(--secondary-color);
      margin: 0;
    }
  }
}

// Image Preview Gallery
.image-preview-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 20px;

  .preview-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--light-color);
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
      color: white;
      font-size: 16px;

      &:hover {
        background: rgba(183, 58, 78, 0.9);
        transform: scale(1.1);
      }
    }
  }
}

.image-error {
  padding: 10px;
  background-color: rgba(183, 58, 78, 0.1);
  border: 1px solid var(--danger-color);
  border-radius: 6px;
  color: var(--danger-color);
  font-size: 12px;
  margin-top: 8px;
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

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: var(--secondary-color);
}

@media (max-width: 768px) {
  .add-review-content {
    padding: 20px;

    h1 {
      font-size: 24px;
    }
  }

  .product-display {
    gap: 15px;

    .product-image {
      width: 100px;
      height: 100px;
    }

    .product-info {
      h2 {
        font-size: 14px;
      }

      .product-description {
        font-size: 12px;
      }
    }
  }

  .rating-selector .star-btn {
    font-size: 28px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
