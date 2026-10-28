<template>
  <main class="auth-page">
    <div class="auth-bg">
      <div class="auth-bg__orb auth-bg__orb--pink"></div>
      <div class="auth-bg__orb auth-bg__orb--purple"></div>
    </div>

    <div class="auth-container">
      <div class="auth-form-section">
        <div class="auth-form-wrapper">
          <div class="auth-brand">
            <span class="auth-brand__logo">K</span>
            <div>
              <h1 class="auth-brand__title">MyKpopTrade</h1>
              <p class="auth-brand__subtitle">Connecte-toi à ton univers K-pop</p>
            </div>
          </div>

          <TwoFactorStep
            v-if="twoFactorToken"
            :token="twoFactorToken"
            @verified="openApp"
            @cancel="twoFactorToken = ''"
          />
          <LoginPasswordForm
            v-else
            v-model:username="username"
            :initial-error="oauthError"
            @authenticated="openApp"
            @two-factor-required="startTwoFactor"
          />
        </div>
      </div>

      <div class="auth-visual">
        <div class="auth-visual__content">
          <img
            src="@/assets/images/image.webp"
            alt="Photocards K-pop : achetez, vendez, collectionnez"
            class="auth-visual__image"
          />
          <div class="auth-visual__overlay"></div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { safeRedirect } from '@/router/safeRedirect';
import LoginPasswordForm from './auth/LoginPasswordForm.vue';
import TwoFactorStep from './auth/TwoFactorStep.vue';

defineOptions({ name: 'LoginView' });

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_no_email: "Google n'a pas fourni d'adresse e-mail.",
  google_auth_failed: "La connexion Google a échoué. Réessaie.",
  google_email_unverified: "Ton adresse e-mail Google n'est pas vérifiée.",
  discord_no_email: "Discord n'a pas fourni d'adresse e-mail.",
  discord_auth_failed: "La connexion Discord a échoué. Réessaie.",
  discord_email_unverified: "Vérifie d'abord ton adresse e-mail sur Discord, puis réessaie.",
  server_error: "Erreur serveur pendant la connexion.",
  oauth_state_invalid: "La connexion a expiré ou a été lancée depuis un autre navigateur. Réessaie.",
};

const router = useRouter();
const route = useRoute();

const username = ref('');

const errorCode = route.query.error;
const oauthError = ref(
  typeof errorCode === 'string' && errorCode
    ? OAUTH_ERROR_MESSAGES[errorCode] || 'Connexion indisponible.'
    : ''
);

// Retour d'OAuth (Google/Discord) sur un compte protégé par la 2FA : le back
// n'ouvre pas la session et renvoie seulement le jeton de défi. Vide tant que
// le mot de passe n'a pas été validé, ou après « Annuler ».
const oauthTwoFactorToken = route.query.twoFactorToken;
const twoFactorToken = ref(
  typeof oauthTwoFactorToken === 'string' ? oauthTwoFactorToken : ''
);

onMounted(() => {
  // Retire le code d'erreur ou le jeton de l'URL : ni rejouable, ni partagé par copier-coller.
  if (oauthError.value || twoFactorToken.value) {
    router.replace({ path: '/login', query: {} });
  }
});

function startTwoFactor(token: string) {
  // Le formulaire est recréé après « Annuler » : l'erreur d'OAuth, désormais
  // dépassée, ne doit pas y réapparaître.
  oauthError.value = '';
  twoFactorToken.value = token;
}

/** Page protégée qui a renvoyé vers la connexion, sinon le tableau de bord. */
function openApp() {
  router.push(safeRedirect(route.query.redirect) ?? '/adherents/dashboard');
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.auth-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;

  &--pink {
    width: 400px;
    height: 400px;
    background: var(--accent-pink);
    top: -100px;
    left: -100px;
  }

  &--purple {
    width: 500px;
    height: 500px;
    background: var(--accent-purple);
    bottom: -150px;
    right: -150px;
  }
}

.auth-container {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.auth-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.auth-form-wrapper {
  width: 100%;
  max-width: 420px;
  animation: fadeInUp 0.5s ease;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.auth-brand__logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  font-weight: 800;
  font-size: 1.4rem;
  border-radius: var(--radius-md);
}

.auth-brand__title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  letter-spacing: 0.05em;
  margin: 0;
}

.auth-brand__subtitle {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin: 4px 0 0;
}

.auth-visual {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  position: relative;
}

.auth-visual__content {
  position: relative;
  width: 100%;
  max-width: 500px;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.auth-visual__image {
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
  animation: float 4s ease-in-out infinite;
}

.auth-visual__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, var(--bg-primary) 100%);
  pointer-events: none;
}

@media (max-width: 768px) {
  .auth-visual {
    display: none;
  }

  .auth-form-section {
    padding: var(--space-lg);
  }

  .auth-brand {
    margin-bottom: var(--space-xl);
  }
}
</style>
