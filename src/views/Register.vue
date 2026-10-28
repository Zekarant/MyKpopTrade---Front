<template>
  <main class="auth-page">
    <div class="auth-bg">
      <div class="auth-bg__orb auth-bg__orb--purple"></div>
      <div class="auth-bg__orb auth-bg__orb--pink"></div>
    </div>

    <div class="auth-container">
      <!-- Left: Form -->
      <div class="auth-form-section">
        <div class="auth-form-wrapper">
          <!-- Logo -->
          <div class="auth-brand">
            <span class="auth-brand__logo">K</span>
            <div>
              <h1 class="auth-brand__title">MyKpopTrade</h1>
              <p class="auth-brand__subtitle">Rejoins la communauté K-pop</p>
            </div>
          </div>

          <!-- Pas de champ téléphone : l'API l'ignorait à l'inscription (il se
               vérifie plus tard, depuis les paramètres). Le collecter ici
               contredisait la minimisation des données (RGPD art. 5(1)(c)). -->
          <form class="auth-form" @submit.prevent="register">
            <!-- Username -->
            <div class="form-group">
              <label class="form-label" for="register-username">Pseudo</label>
              <div class="input-group--custom" :class="{ 'input-group--error': errorField === 'username' }">
                <span class="input-icon"><i class="bi bi-person"></i></span>
                <input
id="register-username" v-model="username" type="text" placeholder="Ton pseudo"
                  autocomplete="username" required />
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label" for="register-email">Email</label>
              <div class="input-group--custom" :class="{ 'input-group--error': errorField === 'email' }">
                <span class="input-icon"><i class="bi bi-envelope"></i></span>
                <input
id="register-email" v-model="email" type="email" placeholder="Ton adresse email"
                  autocomplete="email" required />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="form-label" for="register-password">Mot de passe</label>
              <div class="input-group--custom" :class="{ 'input-group--error': errorField === 'password' }">
                <span class="input-icon"><i class="bi bi-lock"></i></span>
                <input
id="register-password" v-model="password" type="password" placeholder="Mot de passe"
                  autocomplete="new-password" required />
              </div>
              <small class="hint">
                8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un
                caractère spécial parmi {{ PASSWORD_SPECIAL_CHARS }}
              </small>
            </div>

            <!-- Confirm password -->
            <div class="form-group">
              <label class="form-label" for="register-password-confirm">Confirmation</label>
              <div class="input-group--custom" :class="{ 'input-group--error': errorField === 'passwordConfirm' }">
                <span class="input-icon"><i class="bi bi-lock"></i></span>
                <input
id="register-password-confirm" v-model="passwordConfirm" type="password"
                  placeholder="Confirmer le mot de passe" autocomplete="new-password" required />
              </div>
            </div>

            <!-- Beta notice -->
            <div class="auth-beta-notice">
              <span class="auth-beta-notice__tag">BÊTA</span>
              <p>
                MyKpopTrade est en version bêta : des bugs, interruptions ou réinitialisations de
                données peuvent survenir. Le service est fourni « en l'état », sans garantie.
                <router-link to="/beta" target="_blank">En savoir plus</router-link>
              </p>
            </div>

            <!-- Beta acknowledgement checkbox -->
            <label class="auth-checkbox">
              <input v-model="acceptBeta" type="checkbox" :class="{ 'is-invalid': errorField === 'acceptBeta' }" />
              <span>Je comprends que MyKpopTrade est en bêta et j'utilise le service à mes risques.</span>
            </label>

            <!-- Policy checkbox -->
            <label class="auth-checkbox">
              <input v-model="acceptPolicy" type="checkbox" :class="{ 'is-invalid': errorField === 'acceptPolicy' }" />
              <span>
                J'accepte les
                <router-link to="/cgu" target="_blank">CGU</router-link>
                et la
                <router-link to="/privacy" target="_blank">politique de confidentialité</router-link>.
              </span>
            </label>

            <!-- Consentement marketing : RGPD art. 4(11) et 7(4) — il doit être
                 spécifique et libre, donc séparé de l'acceptation des CGU et
                 décoché par défaut. Refuser ne bloque pas l'inscription. -->
            <label class="auth-checkbox">
              <input v-model="acceptMarketing" type="checkbox" />
              <span>
                J'accepte de recevoir les actualités et bons plans de MyKpopTrade par email.
                <em>(facultatif, révocable à tout moment)</em>
              </span>
            </label>

            <!-- Errors -->
            <Transition name="fade">
              <div v-if="errorMessage" class="auth-message auth-message--error" role="alert">
                <i class="bi bi-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>
            </Transition>

            <Transition name="fade">
              <div v-if="successMessage" class="auth-message auth-message--success">
                <i class="bi bi-check-circle"></i>
                <span>{{ successMessage }}</span>
              </div>
            </Transition>

            <button class="btn btn-primary w-full" type="submit" :disabled="loading">
              {{ loading ? 'Inscription…' : "S'inscrire" }}
            </button>

            <OAuthButtons divider-label="ou s'inscrire avec" />

            <!-- Links -->
            <div class="auth-links">
              <router-link to="/login" class="auth-links__item">
                Déjà un compte ? <strong>Se connecter</strong>
              </router-link>
            </div>
          </form>
        </div>
      </div>

      <!-- Right: Visual -->
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
import { useRouter } from 'vue-router';
import { PASSWORD_SPECIAL_CHARS, useRegisterForm } from '@/composables/useRegisterForm';
import OAuthButtons from './auth/OAuthButtons.vue';

defineOptions({ name: 'RegisterView' });

const router = useRouter();
const {
  username,
  email,
  password,
  passwordConfirm,
  acceptBeta,
  acceptPolicy,
  acceptMarketing,
  errorMessage,
  errorField,
  successMessage,
  loading,
  submit
} = useRegisterForm();

async function register() {
  if (await submit()) {
    // Le temps de lire le message de l'API (vérification de l'email à faire).
    setTimeout(() => router.push('/login'), 1500);
  }
}
</script>

<style lang="scss" scoped>
@use './auth/auth-form';

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
    bottom: -100px;
    left: -100px;
  }

  &--purple {
    width: 500px;
    height: 500px;
    background: var(--accent-purple);
    top: -150px;
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
  margin-bottom: var(--space-xl);
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

.hint {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.auth-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;

  input[type="checkbox"] {
    accent-color: var(--accent-pink);
    width: 1.2em;
    height: 1.2em;
    margin-top: 2px;
    flex-shrink: 0;
  }

  a {
    color: var(--accent-pink-light);
    text-decoration: underline;
  }
}

.auth-beta-notice {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--warning-light);
  border: 1px solid var(--warning);
  border-radius: var(--radius-md);

  p {
    margin: 0;
    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: var(--text-secondary);
  }

  a {
    color: var(--accent-pink);
    font-weight: 600;
    text-decoration: underline;
    white-space: nowrap;
  }
}

.auth-beta-notice__tag {
  flex-shrink: 0;
  height: fit-content;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--warning-text);
  border: 1px solid var(--warning);
  border-radius: var(--radius-full);
  padding: 1px 8px;
}

.auth-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.auth-links__item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;

  &:hover { color: var(--accent-pink); }

  strong { color: var(--accent-pink-light); }
}

.auth-visual {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
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
  .auth-visual { display: none; }
  .auth-form-section { padding: var(--space-lg); }
}
</style>
