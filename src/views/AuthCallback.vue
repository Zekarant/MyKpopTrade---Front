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
import Cookies from 'js-cookie';

export default defineComponent({
  name: 'AuthCallback',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const error = ref<string>('');
    const welcome = ref<string>('');

    onMounted(() => {
      const accessToken = route.query.accessToken as string | undefined;
      const refreshToken = route.query.refreshToken as string | undefined;
      const userId = route.query.userId as string | undefined;
      const errParam = route.query.error as string | undefined;
      const isNewAccount = route.query.newAccount === '1';
      const provider = (route.query.provider as string | undefined) || '';
      const providerLabel =
        provider === 'discord' ? 'Discord' : provider === 'google' ? 'Google' : '';

      if (errParam) {
        error.value = `Échec de connexion : ${errParam}`;
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      if (!accessToken || !refreshToken || !userId) {
        error.value = 'Tokens manquants dans la réponse.';
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      Cookies.set('sessionToken', accessToken, { expires: 15 / 1440 });
      Cookies.set('refreshToken', refreshToken, { expires: 1 });
      Cookies.set('id_user', userId, { expires: 1 });
      sessionStorage.removeItem('favorites');

      if (isNewAccount) {
        welcome.value = providerLabel
          ? `Bienvenue ! Votre compte a été créé via ${providerLabel}. Pensez à compléter votre profil.`
          : 'Bienvenue ! Votre compte a été créé. Pensez à compléter votre profil.';
        setTimeout(() => router.replace('/adherents/dashboard'), 1500);
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
