<template>
  <main class="page sell-root">
    <div class="content">
      <!-- En-tête -->
      <div class="sell-header">
        <button type="button" class="sell-header__back" aria-label="Retour" @click="router.back()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <div class="sell-header__text">
          <h3 class="sell-header__title">
            {{ isEditing ? 'Modifier l\'annonce' : 'Vendre un article' }}
          </h3>
          <p class="sell-header__subtitle">
            Étape {{ currentStep }} sur {{ SELL_STEPS.length }} · {{ currentStepMeta.label }}
          </p>
        </div>
      </div>

      <!-- Blocage paiement : PayPal requis -->
      <div v-if="!paymentConfigured && !loadingPaymentStatus" class="paypal-required-banner">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div>
          <strong>Configuration paiement requise</strong>
          <p>
            Pour vendre sur MyKpopTrade, vous devez connecter un compte PayPal capable de
            recevoir des paiements. Sans cela, un acheteur ne pourrait pas vous payer.
          </p>
        </div>
        <div class="paypal-required-banner__actions">
          <button class="btn-primary" :disabled="connectingPaypal" @click="connectPayPal">
            <i class="bi bi-paypal"></i>
            {{ connectingPaypal ? 'Redirection…' : 'Connecter PayPal' }}
          </button>
          <router-link to="/adherents/settings?section=paiements" class="btn-secondary">
            <i class="bi bi-gear"></i> Gérer mes paiements
          </router-link>
        </div>
      </div>

      <div v-else-if="loadingPaymentStatus" class="sell-loading">
        <i class="bi bi-hourglass-split"></i> Vérification de votre compte de paiement…
      </div>

      <template v-if="paymentConfigured">
        <!-- Fil d'étapes -->
        <ol class="sell-steps" aria-label="Progression">
          <li
            v-for="step in SELL_STEPS"
            :key="step.id"
            class="sell-steps__item"
            :class="{
              'sell-steps__item--active': step.id === currentStep,
              'sell-steps__item--done': step.id < currentStep
            }"
          >
            <button
              type="button"
              class="sell-steps__btn"
              :disabled="step.id > currentStep"
              :aria-current="step.id === currentStep ? 'step' : undefined"
              @click="goToStep(step.id)"
            >
              <span class="sell-steps__marker">
                <i v-if="step.id < currentStep" class="bi bi-check-lg"></i>
                <template v-else>{{ step.id }}</template>
              </span>
              <span class="sell-steps__label">{{ step.label }}</span>
            </button>
          </li>
        </ol>

        <form @submit.prevent="onSubmit">
          <!-- v-show plutôt que v-if : chaque étape garde sa saisie et son catalogue chargé. -->
          <PostPhotosStep
            v-show="currentStep === 1"
            :images="images"
            :max-images="MAX_POST_IMAGES"
            @add="addFiles"
            @remove="removeImage"
          />
          <PostInfoStep v-show="currentStep === 2" v-model:form="formData" />
          <PostCatalogStep
            v-show="currentStep === 3"
            v-model:form="formData"
            v-model:group-label="groupLabel"
            v-model:album-label="albumLabel"
            :is-member-required="isMemberRequired"
          />
          <PostShippingStep v-show="currentStep === 4" v-model:form="formData" v-model:pwyw="pwyw" :currency-symbol="currencySymbol" />
          <PostRecapStep
            v-show="currentStep === 5"
            :form="formData"
            :thumbnail="images[0]?.preview ?? ''"
            :image-count="images.length"
            :group-label="groupLabel"
            :album-label="albumLabel"
            :pwyw="pwyw"
            :currency-symbol="currencySymbol"
            :issues="allBlockingIssues"
            @go-to-step="goToStep"
          />

          <div v-for="message in [errorMessage, imageError, stepError].filter(Boolean)" :key="message" class="form-error-message" role="alert">
            <i class="bi bi-exclamation-circle-fill"></i>
            {{ message }}
          </div>

          <!-- Navigation -->
          <div class="sell-nav">
            <button v-if="currentStep > 1" type="button" class="btn-secondary" @click="previousStep">
              <i class="bi bi-arrow-left"></i> Retour
            </button>
            <span class="sell-nav__spacer"></span>
            <button v-if="currentStep < SELL_STEPS.length" type="button" class="btn-primary" @click="nextStep">
              Continuer <i class="bi bi-arrow-right"></i>
            </button>
            <button
              v-else
              class="btn-primary"
              type="submit"
              :disabled="saveLoading || allBlockingIssues.length > 0"
            >
              <i :class="saveLoading ? 'bi bi-hourglass-split' : (isEditing ? 'bi bi-pencil' : 'bi bi-rocket-takeoff')"></i>
              {{ saveLoading ? 'Envoi…' : (isEditing ? 'Enregistrer les modifications' : 'Publier l\'annonce') }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
/** Mise en vente (ou modification) d'une annonce, en cinq étapes. */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import authentification from '@/services/authentification.service';
import { useImageUpload } from '@/composables/useImageUpload';
import { SELL_STEPS, usePostFormValidation } from '@/composables/usePostFormValidation';
import { usePostSave } from '@/composables/usePostSave';
import { useSellerPaymentStatus } from '@/composables/useSellerPaymentStatus';
import { MAX_POST_IMAGES, emptyPostForm, formFromEditedPost, parseEditedPost, type PwywSettings } from './add_post/postForm';
import PostPhotosStep from './add_post/PostPhotosStep.vue';
import PostInfoStep from './add_post/PostInfoStep.vue';
import PostCatalogStep from './add_post/PostCatalogStep.vue';
import PostShippingStep from './add_post/PostShippingStep.vue';
import PostRecapStep from './add_post/PostRecapStep.vue';

defineOptions({ name: 'AddPost' });

const route = useRoute();
const router = useRouter();

const { paymentConfigured, loadingPaymentStatus, connectingPaypal, connectPayPal } = useSellerPaymentStatus();

// ── Formulaire, prérempli en modification ───────────────────────────────
const editedPost = parseEditedPost(route.query.postData);
const isEditing = editedPost !== null;
const prefill = editedPost ? formFromEditedPost(editedPost) : null;

const formData = ref(prefill?.form ?? emptyPostForm());
const pwyw = ref<PwywSettings>(prefill?.pwyw ?? { enabled: false, min: '', max: '' });
const groupLabel = ref(prefill?.groupLabel ?? '');
const albumLabel = ref(prefill?.albumLabel ?? '');

const { images, error: imageError, addFiles, addExistingImages, removeImage, markUploaded } = useImageUpload({
  maxFiles: MAX_POST_IMAGES,
  keepWhatFits: true,
  tooManyMessage: () => `Maximum ${MAX_POST_IMAGES} photos par annonce.`,
});
if (editedPost) addExistingImages(editedPost.images);

const currencySymbol = computed(() => (formData.value.currency === 'USD' ? '$' : '€'));

const { isMemberRequired, blockingIssuesForStep, allBlockingIssues } = usePostFormValidation({
  form: formData,
  imageCount: () => images.value.length,
  pwyw,
});

const { save, saveLoading, errorMessage } = usePostSave({
  form: formData,
  imageSources: () => images.value.map((image) => image.source),
  markImageUploaded: markUploaded,
  pwyw,
  editedPost,
});

// ── Progression entre étapes ────────────────────────────────────────────
const currentStep = ref(1);
const stepError = ref('');
const currentStepMeta = computed(() => SELL_STEPS.find((step) => step.id === currentStep.value) ?? SELL_STEPS[0]);

function showStep(step: number, error = '') {
  stepError.value = error;
  currentStep.value = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const goToStep = (step: number) => {
  if (step <= currentStep.value) showStep(step);
};

function nextStep() {
  const [issue] = blockingIssuesForStep(currentStep.value);
  if (issue) {
    stepError.value = issue.message;
    return;
  }
  showStep(Math.min(currentStep.value + 1, SELL_STEPS.length));
}

const previousStep = () => showStep(Math.max(currentStep.value - 1, 1));

/** Renvoie sur la première étape fautive plutôt que de poster. */
function onSubmit() {
  const [issue] = allBlockingIssues.value;
  if (issue) {
    showStep(issue.step, issue.message);
    return;
  }
  stepError.value = '';
  return save();
}

onMounted(() => {
  // Sans session, verifSession déconnecte et renvoie vers /login.
  authentification.verifSession().catch(() => undefined);
});
</script>

<style lang="scss">
@use 'sass:meta';

// Rattachée à la classe racine plutôt qu'au scope : les étapes (composants
// enfants) en héritent, avec la même spécificité que `.x[data-v]`.
.sell-root {
  @include meta.load-css('../../css/add_post.scss');
}
</style>
