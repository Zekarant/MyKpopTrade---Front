<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-shield-lock"></i> Mot de passe</h3>
    <div class="settings-card__body">
      <div v-if="!showPasswordForm" v-keyboard-click class="setting-row setting-row--clickable" @click="showPasswordForm = true">
        <div class="setting-row__left">
          <span>Changer le mot de passe</span>
        </div>
        <i class="bi bi-chevron-right" aria-hidden="true"></i>
      </div>
      <div v-else class="password-form">
        <input v-model="currentPassword" type="password" placeholder="Mot de passe actuel" aria-label="Mot de passe actuel" autocomplete="current-password" class="settings-input" />
        <input v-model="newPassword" type="password" placeholder="Nouveau mot de passe" aria-label="Nouveau mot de passe" autocomplete="new-password" class="settings-input" />
        <input v-model="confirmPassword" type="password" placeholder="Confirmer le nouveau mot de passe" aria-label="Confirmer le nouveau mot de passe" autocomplete="new-password" class="settings-input" />
        <div class="password-form__actions">
          <button class="btn-settings btn-settings--ghost" @click="showPasswordForm = false">Annuler</button>
          <button class="btn-settings btn-settings--primary" @click="savePassword">Enregistrer</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Double authentification -->
  <TwoFactorCard />

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-link-45deg"></i> Comptes liés</h3>
    <div class="settings-card__body">
      <div
        v-keyboard-click="!profile.socialAuth?.google?.id"
        class="setting-row"
        :class="{ 'setting-row--clickable': !profile.socialAuth?.google?.id }"
        @click="linkProvider('google')"
      >
        <div class="setting-row__left">
          <i class="bi bi-google oauth-icon--google"></i>
          <span>Google</span>
        </div>
        <span v-if="profile.socialAuth?.google?.id" class="setting-badge setting-badge--success">
          <i class="bi bi-check-circle-fill"></i> Connecté
        </span>
        <span v-else class="setting-badge setting-badge--link">Lier le compte</span>
      </div>
      <div
        v-keyboard-click="!profile.socialAuth?.discord?.id"
        class="setting-row"
        :class="{ 'setting-row--clickable': !profile.socialAuth?.discord?.id }"
        @click="linkProvider('discord')"
      >
        <div class="setting-row__left">
          <i class="bi bi-discord oauth-icon--discord"></i>
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
import accountService, { type LinkableProvider } from '@/services/account.service';
import { vKeyboardClick } from '@/composables/vKeyboardClick';
import { apiMessage, isSessionLost } from './shared';
import type { SectionProps } from './shared';

const props = defineProps<SectionProps>();

const showPasswordForm = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

async function savePassword() {
  try {
    const message = await accountService.updatePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    });
    func.showToastSuccess(message);
    showPasswordForm.value = false;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur'));
  }
}

// L'URL de redirection porte un ticket à usage unique, jamais le jeton d'accès.
async function linkProvider(provider: LinkableProvider) {
  if (props.profile.socialAuth?.[provider]?.id) return;
  try {
    const ticket = await accountService.requestLinkTicket(provider);
    window.location.href = `${API_URL}/api/auth/${provider}/link?ticket=${encodeURIComponent(ticket)}`;
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'La liaison du compte a échoué.'));
  }
}
</script>
