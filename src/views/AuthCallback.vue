<template>
  <main class="auth-callback">
    <div class="loader">
      <p v-if="error" class="text-danger">{{ error }}</p>
      <p v-else-if="welcome" class="text-success">{{ welcome }}</p>
      <p v-else>Connexion en cours…</p>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { setSessionCookies } from '@/services/session.cookies';
import authentificationService from '@/services/authentification.service';

export default defineComponent({
  name: 'AuthCallback',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const error = ref<string>('');
    const welcome = ref<string>('');

    /**
     * Ouvre la session. L'API remet un code à usage unique ; les jetons en
     * clair dans l'URL ne servent plus qu'à une API pas encore mise à jour
     * (déploiement du front avant celui de l'API).
     */
    async function openSession(): Promise<boolean> {
      const code = route.query.code as string | undefined;
      if (code) {
        try {
          await authentificationService.exchangeOAuthCode(code);
          return true;
        } catch (e) {
          error.value = (e as Error).message;
          return false;
        }
      }

      const accessToken = route.query.accessToken as string | undefined;
      const refreshToken = route.query.refreshToken as string | undefined;
      const userId = route.query.userId as string | undefined;
      if (!accessToken || !refreshToken || !userId) {
        error.value = 'Tokens manquants dans la réponse.';
        return false;
      }
      setSessionCookies({ accessToken, refreshToken, userId });
      sessionStorage.removeItem('favorites');
      return true;
    }

    onMounted(async () => {
      // Retirer tout de suite le code (ou les jetons) de l'URL : historique,
      // capture d'écran, partage. On les a déjà lus dans `route.query`.
      window.history.replaceState(window.history.state, '', window.location.pathname);

      const errParam = route.query.error as string | undefined;
      const isNewAccount = route.query.newAccount === '1';
      const requiresProfileCompletion = route.query.completeProfile === '1';
      const provider = (route.query.provider as string | undefined) || '';
      const providerLabel =
        provider === 'discord' ? 'Discord' : provider === 'google' ? 'Google' : '';

      if (errParam) {
        error.value = `Échec de connexion : ${errParam}`;
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

    return { error, welcome };
  },
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
  color: var(--danger-color, #dc3545);
}
.text-success {
  color: var(--success-color, #198754);
}
</style>
