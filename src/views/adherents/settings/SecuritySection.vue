<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-shield-lock"></i> Mot de passe</h3>
    <div class="settings-card__body">
      <div v-if="!showPasswordForm" class="setting-row setting-row--clickable" @click="showPasswordForm = true">
        <div class="setting-row__left">
          <span>Changer le mot de passe</span>
        </div>
        <i class="bi bi-chevron-right"></i>
      </div>
      <div v-else class="password-form">
        <input type="password" v-model="currentPassword" placeholder="Mot de passe actuel" autocomplete="current-password" class="settings-input" />
        <input type="password" v-model="newPassword" placeholder="Nouveau mot de passe" autocomplete="new-password" class="settings-input" />
        <input type="password" v-model="confirmPassword" placeholder="Confirmer le nouveau mot de passe" autocomplete="new-password" class="settings-input" />
        <div class="password-form__actions">
          <button @click="showPasswordForm = false" class="btn-settings btn-settings--ghost">Annuler</button>
          <button @click="savePassword" class="btn-settings btn-settings--primary">Enregistrer</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Double authentification -->
  <TwoFactorCard />

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-link-45deg"></i> Comptes liés</h3>
    <div class="settings-card__body">
      <div class="setting-row" :class="{ 'setting-row--clickable': !profile.socialAuth?.google?.id }" @click="linkProvider('google')">
        <div class="setting-row__left">
          <i class="bi bi-google" style="color: #4285F4;"></i>
          <span>Google</span>
        </div>
        <span v-if="profile.socialAuth?.google?.id" class="setting-badge setting-badge--success">
          <i class="bi bi-check-circle-fill"></i> Connecté
        </span>
        <span v-else class="setting-badge setting-badge--link">Lier le compte</span>
      </div>
      <div class="setting-row" :class="{ 'setting-row--clickable': !profile.socialAuth?.discord?.id }" @click="linkProvider('discord')">
        <div class="setting-row__left">
          <i class="bi bi-discord" style="color: #5865F2;"></i>
          <span>Discord</span>
        </div>
        <span v-if="profile.socialAuth?.discord?.id" class="setting-badge setting-badge--success">
          <i class="bi bi-check-circle-fill"></i> Connecté
        </span>
        <span v-else class="setting-badge setting-badge--link">Lier le compte</span>
      </div>
      <small class="field__hint">
        Lier un compte permet de se connecter en un clic. Votre pseudo MyKpopTrade reste
        celui défini dans l'onglet « Profil ».
      </small>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TwoFactorCard from '@/components/adherents/TwoFactorCard.vue';
import { func } from '@/function';
import { API_URL } from '@/config/api';
import { api, apiMessage, isSessionLost } from './shared';
import type { SectionProps } from './shared';

const props = defineProps<SectionProps>();

const showPasswordForm = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

async function savePassword() {
  try {
    const res = await api.put('/api/auth/update-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    });
    func.showToastSuccess(res.data.message);
    showPasswordForm.value = false;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur'));
  }
}

// Une redirection ne peut pas porter d'en-tête Authorization. Plutôt que le
// jeton d'accès, l'URL porte un ticket à usage unique valable une minute,
// obtenu par une requête authentifiée (le client renouvelle la session si
// besoin).
async function linkProvider(provider: 'google' | 'discord') {
  if (props.profile.socialAuth?.[provider]?.id) return;
  try {
    const { data } = await api.post<{ ticket: string }>(`/api/auth/link/${provider}`);
    window.location.href = `${API_URL}/api/auth/${provider}/link?ticket=${encodeURIComponent(data.ticket)}`;
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'La liaison du compte a échoué.'));
  }
}
</script>
