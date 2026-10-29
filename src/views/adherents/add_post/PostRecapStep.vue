<template>
  <fieldset class="form-section">
    <legend><i class="bi bi-check2-square"></i> Récapitulatif</legend>

    <div class="sell-recap">
      <div class="sell-recap__media">
        <img v-if="thumbnail" :src="thumbnail" alt="Vignette de l'annonce" />
        <div v-else class="sell-recap__media-empty"><i class="bi bi-image"></i></div>
      </div>
      <div class="sell-recap__body">
        <h4 class="sell-recap__title">{{ form.title || 'Sans titre' }}</h4>
        <p class="sell-recap__price">
          {{ formatPrice(form.price) }}
          <span v-if="shippingCost" class="sell-recap__shipping">
            + {{ formatPrice(shippingCost) }} de port
          </span>
          <span v-else class="sell-recap__shipping">· port offert</span>
        </p>
        <ul class="sell-recap__meta">
          <li><i class="bi bi-tag"></i> {{ typeLabel }} · {{ conditionLabel }}</li>
          <li v-if="groupLabel"><i class="bi bi-music-note-beamed"></i> {{ groupLabel }}<template v-if="form.kpopMember"> — {{ form.kpopMember }}</template></li>
          <li v-if="albumLabel || form.version"><i class="bi bi-disc"></i> {{ [albumLabel, form.version].filter(Boolean).join(' · ') }}</li>
          <li v-if="form.isOfficial !== undefined"><i class="bi bi-patch-check"></i> {{ form.isOfficial ? 'Officiel' : 'Non officiel' }}</li>
          <li><i class="bi bi-truck"></i> {{ shippingLabel }}</li>
          <li><i class="bi bi-images"></i> {{ imageCount }} photo{{ imageCount > 1 ? 's' : '' }}</li>
          <li>
            <i class="bi bi-chat-dots"></i>
            <template v-if="pwyw.enabled">Prix libre : {{ pwywRecap }}</template>
            <template v-else>{{ form.allowOffers ? 'Offres de prix acceptées' : 'Prix ferme' }}</template>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="issues.length" class="sell-issues">
      <p class="sell-issues__title">
        <i class="bi bi-exclamation-circle"></i>
        À compléter avant de publier :
      </p>
      <ul>
        <li v-for="issue in issues" :key="issue.message">
          <button type="button" @click="emit('goToStep', issue.step)">
            {{ issue.message }}
            <i class="bi bi-arrow-right-short"></i>
          </button>
        </li>
      </ul>
    </div>

    <p v-else class="sell-ready">
      <i class="bi bi-check-circle-fill"></i>
      Tout est prêt. En publiant, vous confirmez être propriétaire de l'article et
      accepter les <router-link to="/cgu" target="_blank">CGU</router-link>.
    </p>
  </fieldset>
</template>

<script setup lang="ts">
/** Étape « Vérification » de la vente : aperçu de l'annonce et points restant à compléter. */
import { computed } from 'vue';
import { optionalAmount, pwywRangeLabel } from '@/components/offerRules';
import type { BlockingIssue } from '@/composables/usePostFormValidation';
import type { PostData } from '@/types/post.types';
import { formatPrice as formatAmount } from '@/utils/format';
import { CONDITION_LABELS, TYPE_LABELS, type PwywSettings } from './postForm';

const props = defineProps<{
  form: PostData;
  /** Aperçu de la première photo, ou vide. */
  thumbnail: string;
  imageCount: number;
  groupLabel: string;
  albumLabel: string;
  pwyw: PwywSettings;
  issues: BlockingIssue[];
}>();

const emit = defineEmits<{ goToStep: [step: number] }>();

// Champ vide pendant la saisie : le récapitulatif affiche 0 plutôt que rien.
const formatPrice = (value: number | null | undefined) =>
  formatAmount(Number(value) || 0, props.form.currency || 'EUR');

const typeLabel = computed(() => TYPE_LABELS[props.form.type] ?? props.form.type);
const conditionLabel = computed(() => CONDITION_LABELS[props.form.condition] ?? props.form.condition);

/** Frais de port du mode proposé (national et mondial s'excluent dans ce formulaire). */
const shippingCost = computed(() => {
  const shipping = props.form.shippingOptions;
  if (shipping.nationalOnly) return shipping.nationalCost;
  if (shipping.worldwide) return shipping.worldwideCost;
  return null;
});

const shippingLabel = computed(() => {
  const shipping = props.form.shippingOptions;
  const modes: string[] = [];
  if (shipping.worldwide) modes.push('mondiale');
  if (shipping.nationalOnly) modes.push('nationale');
  if (shipping.localPickup) modes.push('retrait local');
  return modes.length ? modes.join(', ') : 'aucune option choisie';
});

const pwywRecap = computed(() =>
  pwywRangeLabel(optionalAmount(props.pwyw.min), optionalAmount(props.pwyw.max), props.form.currency || 'EUR')
);
</script>
