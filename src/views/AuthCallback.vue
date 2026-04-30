<template>
  <main class="auth-callback">
    <div class="loader">
      <p v-if="!error">Connexion en cours…</p>
      <p v-else class="text-danger">{{ error }}</p>
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

    onMounted(() => {
      const accessToken = route.query.accessToken as string | undefined;
      const refreshToken = route.query.refreshToken as string | undefined;
      const userId = route.query.userId as string | undefined;
      const errParam = route.query.error as string | undefined;

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

      router.replace('/adherents/dashboard');
    });

    return { error };
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
</style>
