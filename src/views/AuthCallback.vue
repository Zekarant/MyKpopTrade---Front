<template>
  <main class="auth-callback">
    <div class="loader">
      <p v-if="error" class="text-danger">{{ error }}</p>
      <p v-else-if="welcome" class="text-success">{{ welcome }}</p>
      <p v-else>Connexion en cours…</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import authentificationService from '@/services/authentification.service';

defineOptions({ name: 'AuthCallback' });

const route = useRoute();
const router = useRouter();
const error = ref<string>('');
const welcome = ref<string>('');

/**
 * Ouvre la session à partir du code à usage unique, seul moyen accepté :
 * des jetons lus dans l'URL permettraient à un lien piégé de connecter la
 * victime au compte de l'attaquant (login CSRF).
 */
async function openSession(): Promise<boolean> {
  const code = route.query.code as string | undefined;
  if (!code) {
    error.value = 'Code de connexion manquant.';
    return false;
  }
  try {
    await authentificationService.exchangeOAuthCode(code);
    return true;
  } catch (e) {
    error.value = (e as Error).message;
    return false;
  }
}

onMounted(async () => {
  // Retirer tout de suite le code (ou les jetons) de l'URL : historique, captures, partage.
  window.history.replaceState(window.history.state, '', window.location.pathname);

  const errParam = route.query.error as string | undefined;
  const isNewAccount = route.query.newAccount === '1';
  const requiresProfileCompletion = route.query.completeProfile === '1';
  const provider = (route.query.provider as string | undefined) || '';
  const providerLabel =
    provider === 'discord' ? 'Discord' : provider === 'google' ? 'Google' : '';

  if (errParam) {
    // Message fixe : le paramètre vient de l'URL, n'importe qui peut le forger.
    error.value = 'Échec de connexion. Réessaie.';
    setTimeout(() => router.push('/login'), 2000);
    return;
  }

  if (!(await openSession())) {
    setTimeout(() => router.push('/login'), 2000);
    return;
  }

  if (requiresProfileCompletion) {
    welcome.value = providerLabel
      ? `Bienvenue ! Quelques infos à compléter pour finaliser ton compte ${providerLabel}.`
      : 'Bienvenue ! Quelques infos à compléter pour finaliser ton compte.';
    setTimeout(() => router.replace('/profile-completion'), 800);
  } else if (isNewAccount) {
    welcome.value = providerLabel
      ? `Bienvenue ! Votre compte a été créé via ${providerLabel}.`
      : 'Bienvenue ! Votre compte a été créé.';
    setTimeout(() => router.replace('/adherents/dashboard'), 1200);
  } else {
    router.replace('/adherents/dashboard');
  }
});

</script>

<style scoped>
.auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.loader {
  text-align: center;
  font-size: 1.1rem;
}
.text-danger {
  color: var(--danger-color, var(--danger));
}
.text-success {
  color: var(--success-color, var(--success));
}
</style>
