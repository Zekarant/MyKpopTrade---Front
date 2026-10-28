<template>
  <main class="auth-page">
    <div class="auth-bg">
      <div class="auth-bg__orb auth-bg__orb--purple"></div>
      <div class="auth-bg__orb auth-bg__orb--pink"></div>
    </div>

    <div class="auth-container">
      <div class="auth-form-wrapper">
        <div class="auth-brand">
          <span class="auth-brand__logo">K</span>
          <div>
            <h1 class="auth-brand__title">MyKpopTrade</h1>
            <p class="auth-brand__subtitle">Choisis ton nouveau mot de passe</p>
          </div>
        </div>

        <div v-if="successMessage" class="auth-form">
          <div class="auth-message auth-message--success">
            <i class="bi bi-check-circle"></i>
            <span>{{ successMessage }}</span>
          </div>
          <router-link to="/login" class="btn btn-primary w-full">Se connecter</router-link>
        </div>

        <form v-else class="auth-form" @submit.prevent="submit">
          <div class="form-group">
            <label class="form-label" for="reset-password">Nouveau mot de passe</label>
            <div class="input-group--custom" :class="{ 'input-group--error': errorMessage }">
              <span class="input-icon"><i class="bi bi-lock"></i></span>
              <input
                id="reset-password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                required
              />
            </div>
            <small class="hint">
              8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un
              caractère spécial parmi {{ PASSWORD_SPECIAL_CHARS }}
            </small>
          </div>

          <div class="form-group">
            <label class="form-label" for="reset-password-confirm">Confirmation</label>
            <div class="input-group--custom" :class="{ 'input-group--error': errorMessage }">
              <span class="input-icon"><i class="bi bi-lock"></i></span>
              <input
                id="reset-password-confirm"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
              />
            </div>
          </div>

          <div v-if="errorMessage" class="auth-message auth-message--error">
            <i class="bi bi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <button class="btn btn-primary w-full" type="submit" :disabled="loading">
            {{ loading ? 'Enregistrement…' : 'Changer le mot de passe' }}
          </button>

          <div class="auth-links">
            <router-link to="/forgot_psw" class="auth-links__item">Demander un nouveau lien</router-link>
            <router-link to="/login" class="auth-links__item auth-links__item--muted">
              <i class="bi bi-arrow-left"></i> Retour à la connexion
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import accountService from '@/services/account.service';
import { apiErrorMessage } from '@/services/apiError';
import { PASSWORD_SPECIAL_CHARS, passwordRuleError } from '@/composables/useRegisterForm';

const route = useRoute();
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);

async function submit() {
  errorMessage.value = passwordRuleError(password.value);
  if (errorMessage.value) return;
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les deux mots de passe ne correspondent pas.';
    return;
  }

  loading.value = true;
  try {
    const message = await accountService.resetPassword(String(route.params.token), password.value, confirmPassword.value);
    successMessage.value = message || 'Mot de passe modifié. Tu peux te connecter.';
  } catch (error) {
    // Lien expiré ou déjà utilisé : l'API le dit, et « Demander un nouveau lien » reste affiché.
    errorMessage.value = apiErrorMessage(error, 'Une erreur est survenue. Réessaie plus tard.');
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use './auth/auth-form';

.auth-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}
.auth-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.auth-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  &--pink { width: 400px; height: 400px; background: var(--accent-pink); bottom: -100px; left: -100px; }
  &--purple { width: 500px; height: 500px; background: var(--accent-purple); top: -150px; right: -150px; }
}
.auth-container {
  display: flex; min-height: 100vh; position: relative; z-index: 1;
  align-items: center; justify-content: center;
  padding: var(--space-xl);
}
.auth-form-wrapper { width: 100%; max-width: 420px; animation: fadeInUp 0.5s ease; }
.auth-brand { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-2xl); }
.auth-brand__logo {
  width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
  background: var(--accent-gradient); color: var(--text-on-accent); font-weight: 800; font-size: 1.4rem;
  border-radius: var(--radius-md);
}
.auth-brand__title { font-size: var(--font-size-xl); font-weight: 800; letter-spacing: 0.05em; margin: 0; }
.auth-brand__subtitle { color: var(--text-muted); font-size: var(--font-size-sm); margin: 4px 0 0; }

.hint { color: var(--text-muted); font-size: var(--font-size-xs); line-height: 1.5; }

.auth-links {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--space-sm); margin-top: var(--space-sm);
}
.auth-links__item {
  font-size: var(--font-size-sm); color: var(--text-secondary); text-decoration: none;
  transition: color var(--transition-fast);
  &:hover { color: var(--accent-pink); }
  &--muted { color: var(--text-muted); font-size: var(--font-size-xs); }
}

@media (max-width: 768px) {
  .auth-container { padding: var(--space-lg); }
}
</style>
