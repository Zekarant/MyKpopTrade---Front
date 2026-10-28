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
            <p class="auth-brand__subtitle">Vérification de ton adresse email</p>
          </div>
        </div>

        <div v-if="status === 'loading'" class="auth-message auth-message--info">
          <i class="bi bi-hourglass-split"></i>
          <span>Vérification en cours…</span>
        </div>

        <div v-else-if="status === 'success'" class="auth-form">
          <div class="auth-message auth-message--success">
            <i class="bi bi-check-circle"></i>
            <span>{{ message }}</span>
          </div>
          <router-link v-if="loggedIn" to="/adherents/dashboard" class="btn btn-primary w-full">
            Aller à mon tableau de bord
          </router-link>
          <router-link v-else to="/login" class="btn btn-primary w-full">Se connecter</router-link>
        </div>

        <form v-else class="auth-form" @submit.prevent="resend">
          <div class="auth-message auth-message--error">
            <i class="bi bi-exclamation-circle"></i>
            <span>{{ message }}</span>
          </div>

          <p class="hint">Saisis ton adresse email pour recevoir un nouveau lien de vérification.</p>
          <div class="form-group">
            <label class="form-label" for="verify-email">Email</label>
            <div class="input-group--custom">
              <span class="input-icon"><i class="bi bi-envelope"></i></span>
              <input id="verify-email" v-model.trim="email" type="email" autocomplete="email" required />
            </div>
          </div>

          <div v-if="resendMessage" class="auth-message" :class="resendFailed ? 'auth-message--error' : 'auth-message--success'">
            <i class="bi" :class="resendFailed ? 'bi-exclamation-circle' : 'bi-check-circle'"></i>
            <span>{{ resendMessage }}</span>
          </div>

          <button class="btn btn-primary w-full" type="submit" :disabled="resending">
            {{ resending ? 'Envoi…' : 'Renvoyer le lien' }}
          </button>

          <div class="auth-links">
            <router-link to="/login" class="auth-links__item">
              <i class="bi bi-arrow-left"></i> Retour à la connexion
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import accountService from '@/services/account.service';
import { hasSession } from '@/services/session.cookies';
import { apiErrorMessage } from '@/services/apiError';

const route = useRoute();
const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('');
// Le lien est souvent ouvert depuis un appareil déjà connecté : inutile de renvoyer vers /login.
const loggedIn = hasSession();

const email = ref('');
const resending = ref(false);
const resendMessage = ref('');
const resendFailed = ref(false);

onMounted(async () => {
  try {
    message.value = (await accountService.verifyEmail(String(route.params.token))) || 'Adresse email vérifiée.';
    status.value = 'success';
  } catch (error) {
    message.value = apiErrorMessage(error, 'Impossible de vérifier ton adresse email.');
    status.value = 'error';
  }
});

async function resend() {
  resending.value = true;
  resendMessage.value = '';
  try {
    const sent = await accountService.resendVerificationEmail(email.value);
    resendFailed.value = false;
    resendMessage.value = sent || 'Un nouveau lien t\'a été envoyé.';
  } catch (error) {
    resendFailed.value = true;
    resendMessage.value = apiErrorMessage(error, 'Envoi impossible. Réessaie plus tard.');
  } finally {
    resending.value = false;
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

.hint { color: var(--text-muted); font-size: var(--font-size-sm); line-height: 1.5; margin: 0; }

.auth-links { display: flex; justify-content: center; margin-top: var(--space-sm); }
.auth-links__item {
  font-size: var(--font-size-sm); color: var(--text-secondary); text-decoration: none;
  transition: color var(--transition-fast);
  &:hover { color: var(--accent-pink); }
}

@media (max-width: 768px) {
  .auth-container { padding: var(--space-lg); }
}
</style>
