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
              <p class="auth-brand__subtitle">Réinitialisation du mot de passe</p>
            </div>
          </div>

          <form @submit.prevent="reset" class="auth-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-group--custom" :class="{ 'input-group--error': errorBase }">
                <span class="input-icon"><i class="bi bi-envelope"></i></span>
                <input type="email" v-model="email" placeholder="Votre adresse email" required />
              </div>
            </div>

            <!-- Errors -->
            <Transition name="fade">
              <div v-if="errorBase" class="auth-message auth-message--error">
                <i class="bi bi-exclamation-circle"></i>
                <span>{{ errorBase }}</span>
              </div>
            </Transition>

            <Transition name="fade">
              <div v-if="successMessage" class="auth-message auth-message--success">
                <i class="bi bi-check-circle"></i>
                <span>{{ successMessage }}</span>
              </div>
            </Transition>

            <button class="btn btn-primary w-full" type="submit">Réinitialiser le mot de passe</button>

            <!-- Links -->
            <div class="auth-links">
              <router-link to="/login" class="auth-links__item">
                <i class="bi bi-arrow-left"></i> Retour à la connexion
              </router-link>
              <router-link to="/register" class="auth-links__item auth-links__item--muted">
                Pas encore de compte ? <strong>S'inscrire</strong>
              </router-link>
            </div>
          </form>
        </div>
      </div>

      <!-- Right: Visual -->
      <div class="auth-visual">
        <div class="auth-visual__content">
          <img src="@/assets/images/image.png" alt="K-pop Exchange" class="auth-visual__image" />
          <div class="auth-visual__overlay"></div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'ForgotPassword',
  setup() {
    const email = ref('');
    const errorBase = ref('');
    const successMessage = ref('');
    const router = useRouter();

    const reset = async () => {
      errorBase.value = '';
      successMessage.value = '';

      if (!email.value || email.value.length < 5) {
        errorBase.value = "L'email est invalide";
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
          { email: email.value },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 200) {
          successMessage.value = response.data.message;
          setTimeout(() => router.push('/login'), 2000);
        } else {
          errorBase.value = response.data.message;
        }
      } catch (error: any) {
        errorBase.value = error.response?.data?.message || 'Une erreur est survenue.';
      }
    };

    return { email, errorBase, successMessage, reset };
  }
});
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  position: relative;
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
  margin-bottom: var(--space-2xl);
}

.auth-brand__logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-gradient);
  color: white;
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.input-group--error {
  border-color: var(--danger) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.auth-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);

  &--success {
    background: var(--success-light);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  &--error {
    background: var(--danger-light);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
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
  transition: color var(--transition-fast);

  &:hover { color: var(--accent-pink); }

  &--muted {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

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

.fade-enter-active, .fade-leave-active {
  transition: all var(--transition-base);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .auth-visual { display: none; }
  .auth-form-section { padding: var(--space-lg); }
}
</style>
