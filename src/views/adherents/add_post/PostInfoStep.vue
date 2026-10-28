<template>
  <fieldset class="form-section">
    <legend><i class="bi bi-tag"></i> Informations</legend>
    <div>
      <label for="title">Titre de l'annonce <span class="req">*</span></label>
      <input id="title" v-model="form.title" type="text" maxlength="120" placeholder="Ex: Photocard Jimin BE Lucky Draw" />
      <small class="form-hint">{{ (form.title || '').length }}/120</small>
    </div>
    <div>
      <label for="description">Description <span class="req">*</span></label>
      <textarea id="description" v-model="form.description" maxlength="2000" placeholder="État, authenticité, provenance, défauts, conditions d'envoi…"></textarea>
      <small class="form-hint">{{ (form.description || '').length }}/2000</small>
    </div>
    <div class="form-row">
      <div class="form-col">
        <label for="price">Prix <span class="req">*</span></label>
        <div class="input-with-addon">
          <input id="price" v-model.number="form.price" type="number" step="0.01" min="0" />
          <select v-model="form.currency" class="input-addon" aria-label="Devise">
            <option value="EUR">€</option>
            <option value="USD">$</option>
          </select>
        </div>
      </div>
      <div class="form-col">
        <label for="condition">État <span class="req">*</span></label>
        <select id="condition" v-model="form.condition">
          <option v-for="(label, value) in CONDITION_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-col">
        <label for="type">Type d'article <span class="req">*</span></label>
        <select id="type" v-model="form.type">
          <option v-for="(label, value) in TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <div class="form-col">
        <label for="category">Catégorie <span class="req">*</span></label>
        <input id="category" v-model="form.category" type="text" placeholder="Ex: Photocard, Lightstick..." />
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
/** Étape « Informations » de la vente : titre, description, prix, état et type. */
import type { PostData } from '@/types/post.types';
import { CONDITION_LABELS, TYPE_LABELS } from './postForm';

const form = defineModel<PostData>('form', { required: true });
</script>
