<template>
  <fieldset class="form-section">
    <legend><i class="bi bi-truck"></i> Livraison</legend>
    <p class="form-intro">
      Choisissez au moins une option d'expédition. Vous disposez de 5 jours ouvrés
      pour expédier après le paiement.
    </p>
    <div class="shipping-options">
      <label class="checkbox-card" :class="{ active: shipping.worldwide, disabled: shipping.nationalOnly }">
        <input v-model="shipping.worldwide" type="checkbox" :disabled="shipping.nationalOnly" />
        <i class="bi bi-globe2"></i>
        <span>Mondiale</span>
      </label>
      <label class="checkbox-card" :class="{ active: shipping.nationalOnly, disabled: shipping.worldwide }">
        <input v-model="shipping.nationalOnly" type="checkbox" :disabled="shipping.worldwide" />
        <i class="bi bi-geo-alt"></i>
        <span>Nationale</span>
      </label>
      <label class="checkbox-card" :class="{ active: shipping.localPickup }">
        <input v-model="shipping.localPickup" type="checkbox" />
        <i class="bi bi-shop"></i>
        <span>Retrait local</span>
      </label>
    </div>
    <div v-for="mode in costModes" :key="mode.costKey">
      <label :for="mode.costKey">{{ mode.label }}</label>
      <div class="input-with-addon">
        <input :id="mode.costKey" v-model.number="shipping[mode.costKey]" type="number" step="0.01" min="0" placeholder="0.00" />
        <span class="input-addon">{{ currencySymbol }}</span>
      </div>
      <small class="form-hint">
        Laissez vide ou à 0 pour offrir les frais de port.
      </small>
    </div>

    <label class="checkbox-inline">
      <input v-model="form.allowOffers" type="checkbox" />
      <span>Accepter les offres de prix</span>
    </label>
    <small class="form-hint">
      Les acheteurs pourront vous proposer un montant, que vous restez libre de
      refuser.
    </small>

    <PostPwywFields v-model:pwyw="pwyw" :currency-symbol="currencySymbol" />
  </fieldset>
</template>

<script setup lang="ts">
/** Étape « Livraison » de la vente : modes d'expédition, frais de port et négociation. */
import { computed } from 'vue';
import type { PostData } from '@/types/post.types';
import type { PwywSettings } from './postForm';
import PostPwywFields from './PostPwywFields.vue';

defineProps<{ currencySymbol: string }>();

const form = defineModel<PostData>('form', { required: true });
const pwyw = defineModel<PwywSettings>('pwyw', { required: true });

const shipping = computed(() => form.value.shippingOptions);

/** Un champ de frais par mode payant coché (national et mondial s'excluent). */
const costModes = computed(() => [
  ...(shipping.value.nationalOnly ? [{ costKey: 'nationalCost' as const, label: 'Frais de port (nationale)' }] : []),
  ...(shipping.value.worldwide ? [{ costKey: 'worldwideCost' as const, label: 'Frais de port (mondiale)' }] : []),
]);
</script>
