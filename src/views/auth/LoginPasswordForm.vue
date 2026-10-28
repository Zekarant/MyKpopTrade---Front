<template>
  <form class="auth-form" @submit.prevent="submit">
    <div class="form-group">
      <label class="form-label" for="login-username">Identifiant</label>
      <div class="input-group--custom" :class="{ 'input-group--error': usernameError }">
        <span class="input-icon"><i class="bi bi-person"></i></span>
        <input
          id="login-username"
          v-model="username"
          type="text"
          placeholder="Ton pseudo"
          autocomplete="username"
          required
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="login-password">Mot de passe</label>
      <div class="input-group--custom" :class="{ 'input-group--error': passwordError }">
        <span class="input-icon"><i class="bi bi-lock"></i></span>
        <input
          id="login-password"
          v-model="password"
          type="password"
          placeholder="Mot de passe"
          autocomplete="current-password"
          required
        />
      </div>
    </div>

    <button class="btn btn-primary w-full" type="submit">
      Se connecter
    </button>

    <OAuthButtons divider-label="ou continuer avec" />

    <div class="auth-links">
      <router-link to="/register" class="auth-links__item">
        Pas encore de compte ? <strong>S'inscrire</strong>
      </router-link>
      <router-link to="/forgot_psw" class="auth-links__item auth-links__item--muted">
        Mot de passe oublié ?
      </router-link>
    </div>

    <Transition name="fade">
      <div
        v-if="errorMessage || successMessage"
        class="auth-message"
        :class="errorMessage ? 'auth-message--error' : 'auth-message--success'"
      >
        <i class="bi" :class="errorMessage ? 'bi-exclamation-circle' : 'bi-check-circle'"></i>
        <span>{{ errorMessage || successMessage }}</span>
      </div>
    </Transition>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import authentificationService from '@/services/authentification.service';
import OAuthButtons from './OAuthButtons.vue';

/**
 * Le pseudo de l'API fait au moins 3 caractères (`validateUsername`) ; un
 * plancher plus haut empêchait les pseudos de 3 ou 4 caractères de se connecter.
 */
const USERNAME_MIN_LENGTH = 3;

const props = defineProps<{
  /** Erreur à afficher dès l'arrivée (retour d'OAuth refusé). */
  initialError?: string;
}>();

const emit = defineEmits<{
  authenticated: [];
  'two-factor-required': [twoFactorToken: string];
}>();

// Porté par la page : il survit à l'aller-retour par l'étape de double authentification.
const username = defineModel<string>('username', { required: true });
const password = ref('');
// L'erreur d'OAuth s'affiche, comme une erreur d'identifiants, sous le champ pseudo.
const usernameError = ref(props.initialError ?? '');
const passwordError = ref('');
const successMessage = ref('');

const errorMessage = computed(() => usernameError.value || passwordError.value);

async function submit() {
  usernameError.value = username.value.length < USERNAME_MIN_LENGTH ? 'Le pseudo doit être plus long' : '';
  passwordError.value = password.value === '' ? 'Le mot de passe ne peut pas être vide' : '';
  if (errorMessage.value) return;

  try {
    const result = await authentificationService.login(username.value, password.value);
    if (result.requiresTwoFactor) {
      // Le mot de passe n'a plus à rester en mémoire à ce stade.
      password.value = '';
      emit('two-factor-required', result.twoFactorToken);
      return;
    }
    successMessage.value = 'Connexion réussie.';
    emit('authenticated');
  } catch (error) {
    usernameError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<style lang="scss" scoped>
@use './auth-form';

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

  &:hover {
    color: var(--accent-pink);
  }

  &--muted {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }

  strong {
    color: var(--accent-pink-light);
  }
}
</style>
