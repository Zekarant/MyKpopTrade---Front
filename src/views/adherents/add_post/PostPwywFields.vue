<template>
  <label class="checkbox-inline">
    <input v-model="pwyw.enabled" type="checkbox" />
    <span>Prix libre</span>
  </label>
  <small class="form-hint">
    Les acheteurs proposent le montant de leur choix dans votre fourchette ;
    vous acceptez, refusez ou faites une contre-offre.
  </small>
  <div v-if="pwyw.enabled" class="form-row">
    <div class="form-col">
      <label for="pwywMin">Prix minimum <span class="req">*</span></label>
      <div class="input-with-addon">
        <input id="pwywMin" v-model.number="pwyw.min" type="number" step="0.01" min="0" placeholder="0.00" />
        <span class="input-addon">{{ currencySymbol }}</span>
      </div>
    </div>
    <div class="form-col">
      <label for="pwywMax">Prix maximum <span class="opt">(optionnel)</span></label>
      <div class="input-with-addon">
        <input id="pwywMax" v-model.number="pwyw.max" type="number" step="0.01" min="0" placeholder="Sans limite" />
        <span class="input-addon">{{ currencySymbol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Réglage du prix libre : fourchette dans laquelle les acheteurs proposent leur montant. */
import type { PwywSettings } from './postForm';

defineProps<{ currencySymbol: string }>();

const pwyw = defineModel<PwywSettings>('pwyw', { required: true });
</script>
