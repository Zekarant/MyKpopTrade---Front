<template>
  <!-- Deuxième facteur : le mot de passe est validé, la session n'est pas encore ouverte. -->
  <form class="auth-form" @submit.prevent="submit">
    <div class="twofa-intro">
      <i class="bi bi-shield-lock"></i>
      <p>
        Saisissez le code à 6 chiffres de votre application
        d'authentification.
      </p>
    </div>

    <div class="form-group">
      <label class="form-label" for="twofa-code">
        {{ useRecoveryCode ? 'Code de secours' : 'Code de vérification' }}
      </label>
      <div class="input-group--custom" :class="{ 'input-group--error': error }">
        <span class="input-icon"><i class="bi bi-123"></i></span>
        <input
          id="twofa-code"
          ref="codeInput"
          v-model="code"
          type="text"
          class="form-control--custom"
          :placeholder="useRecoveryCode ? 'XXXX-XXXX-XXXX' : '000000'"
          :inputmode="useRecoveryCode ? 'text' : 'numeric'"
          :autocomplete="useRecoveryCode ? 'off' : 'one-time-code'"
          :maxlength="useRecoveryCode ? 14 : 6"
          autofocus
        />
      </div>
    </div>

    <button class="btn btn-primary w-full" type="submit" :disabled="verifying">
      {{ verifying ? 'Vérification…' : 'Valider' }}
    </button>

    <div class="twofa-actions">
      <button type="button" class="twofa-link" @click="toggleRecoveryCode">
        {{ useRecoveryCode ? 'Utiliser mon application' : 'Utiliser un code de secours' }}
      </button>
      <button type="button" class="twofa-link" @click="emit('cancel')">
        Annuler
      </button>
    </div>

    <Transition name="fade">
      <div v-if="error" class="auth-message auth-message--error">
        <i class="bi bi-exclamation-circle"></i>
        <span>{{ error }}</span>
      </div>
    </Transition>
  </form>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import authentificationService from '@/services/authentification.service';

const props = defineProps<{
  /**
   * Jeton de défi rendu par /auth/login (ou par le retour d'OAuth) : il ne
   * donne accès qu'à sa propre vérification, et expire en 5 minutes.
   */
  token: string;
}>();

const emit = defineEmits<{
  verified: [];
  cancel: [];
}>();

const code = ref('');
const error = ref('');
const verifying = ref(false);
const useRecoveryCode = ref(false);
const codeInputEl = useTemplateRef<HTMLInputElement>('codeInput');

// `autofocus` n'agit qu'au chargement de la page : cette étape apparaît après
// la soumission du mot de passe, il faut donc placer le focus soi-même.
onMounted(() => codeInputEl.value?.focus());

async function submit() {
  const value = code.value.trim();
  if (!value) {
    error.value = 'Saisissez le code de vérification.';
    return;
  }

  verifying.value = true;
  error.value = '';
  try {
    await authentificationService.verifyTwoFactor(props.token, value);
    emit('verified');
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    code.value = '';
  } finally {
    verifying.value = false;
  }
}

function toggleRecoveryCode() {
  useRecoveryCode.value = !useRecoveryCode.value;
  code.value = '';
  error.value = '';
}
</script>

<style lang="scss" scoped>
@use './auth-form';

.twofa-intro {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);

  i {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--accent-pink);
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.twofa-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.twofa-link {
  background: none;
  border: none;
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: underline;
  cursor: pointer;

  &:hover { color: var(--accent-pink); }

  &:focus-visible {
    outline: 2px solid var(--accent-pink);
    outline-offset: 2px;
    border-radius: var(--radius-xs);
  }
}
</style>
