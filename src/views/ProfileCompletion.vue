<template>
  <main class="auth-page">
    <div class="auth-bg">
      <div class="auth-bg__orb auth-bg__orb--purple"></div>
      <div class="auth-bg__orb auth-bg__orb--pink"></div>
    </div>

    <div class="auth-container">
      <div class="auth-form-section">
        <div class="auth-form-wrapper">
          <div class="auth-brand">
            <span class="auth-brand__logo">K</span>
            <div>
              <h1 class="auth-brand__title">Bienvenue !</h1>
              <p class="auth-brand__subtitle">Finalise ton profil pour commencer à acheter et vendre.</p>
            </div>
          </div>

          <form @submit.prevent="submit" class="auth-form">
            <div class="form-group">
              <label class="form-label">Pseudo</label>
              <div class="input-group--custom">
                <span class="input-icon"><i class="bi bi-person"></i></span>
                <input v-model="form.username" type="text" :placeholder="defaultUsername" />
              </div>
              <small class="hint">Tu peux garder le pseudo généré ou en choisir un.</small>
            </div>

            <div class="form-group">
              <label class="form-label">Téléphone <span class="required">*</span></label>
              <div class="input-group--custom" :class="{ 'input-group--error': errors.phoneNumber }">
                <span class="input-icon"><i class="bi bi-phone"></i></span>
                <input v-model="form.phoneNumber" type="tel" placeholder="+33 6 12 34 56 78" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Bio (optionnel)</label>
              <textarea v-model="form.bio" rows="3" maxlength="500" placeholder="Présente-toi en quelques mots…"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Localisation (optionnel)</label>
              <div class="input-group--custom">
                <span class="input-icon"><i class="bi bi-geo-alt"></i></span>
                <input v-model="form.location" type="text" maxlength="100" placeholder="Ville, pays" />
              </div>
            </div>

            <label class="auth-checkbox">
              <input v-model="form.privacyPolicyAccepted" type="checkbox" required />
              <span>J'accepte la <a href="/politique-confidentialite" target="_blank">politique de confidentialité</a> <span class="required">*</span></span>
            </label>

            <label class="auth-checkbox">
              <input v-model="form.marketingConsent" type="checkbox" />
              <span>Je souhaite recevoir des actualités MyKpopTrade par email (optionnel)</span>
            </label>

            <Transition name="fade">
              <div v-if="errorMessage" class="auth-message auth-message--error">
                <i class="bi bi-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>
            </Transition>

            <button class="btn btn-primary w-full" type="submit" :disabled="loading">
              <span v-if="loading">Enregistrement…</span>
              <span v-else>Terminer l'inscription</span>
            </button>

            <button type="button" class="auth-skip" @click="skip">
              Compléter plus tard
            </button>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/config/api';
import { func } from '@/function';

export default defineComponent({
  name: 'ProfileCompletion',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const errorMessage = ref('');
    const defaultUsername = ref('');
    const errors = reactive<{ phoneNumber?: string }>({});

    const form = reactive({
      username: '',
      phoneNumber: '',
      bio: '',
      location: '',
      privacyPolicyAccepted: false,
      marketingConsent: false,
    });

    onMounted(async () => {
      const token = Cookies.get('sessionToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        defaultUsername.value = data.user?.username || '';
        if (data.user?.profileCompleted) {
          // Déjà rempli — on n'est pas censé être ici.
          router.replace('/adherents/dashboard');
        }
      } catch {
        router.replace('/login');
      }
    });

    const submit = async () => {
      errorMessage.value = '';
      errors.phoneNumber = undefined;
      if (!form.phoneNumber || form.phoneNumber.replace(/\D/g, '').length < 6) {
        errors.phoneNumber = 'Numéro requis';
        errorMessage.value = 'Le téléphone est requis pour finaliser.';
        return;
      }
      if (!form.privacyPolicyAccepted) {
        errorMessage.value = 'Vous devez accepter la politique de confidentialité.';
        return;
      }
      loading.value = true;
      try {
        const token = Cookies.get('sessionToken');
        await axios.post(
          `${API_URL}/api/auth/profile/complete`,
          {
            ...(form.username ? { username: form.username } : {}),
            phoneNumber: form.phoneNumber,
            bio: form.bio || undefined,
            location: form.location || undefined,
            privacyPolicyAccepted: form.privacyPolicyAccepted,
            dataProcessingConsent: form.privacyPolicyAccepted,
            marketingConsent: form.marketingConsent,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        func.showToastSuccess('Profil finalisé, bienvenue !');
        router.replace('/adherents/dashboard');
      } catch (e: any) {
        errorMessage.value = e?.response?.data?.message || 'Erreur lors de l\'enregistrement.';
      } finally {
        loading.value = false;
      }
    };

    const skip = () => {
      router.replace('/adherents/dashboard');
    };

    return { form, errors, errorMessage, loading, defaultUsername, submit, skip };
  },
});
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  background: var(--bg-primary);
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
}
.auth-form-section {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: var(--space-xl);
}
.auth-form-wrapper { width: 100%; max-width: 460px; animation: fadeInUp 0.5s ease; }
.auth-brand { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-xl); }
.auth-brand__logo {
  width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
  background: var(--accent-gradient); color: white; font-weight: 800; font-size: 1.4rem;
  border-radius: var(--radius-md);
}
.auth-brand__title { font-size: var(--font-size-xl); font-weight: 800; letter-spacing: 0.05em; margin: 0; }
.auth-brand__subtitle { color: var(--text-muted); font-size: var(--font-size-sm); margin: 4px 0 0; }

.auth-form { display: flex; flex-direction: column; gap: var(--space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--space-xs); }
.required { color: var(--accent-pink); }
.hint { color: var(--text-muted); font-size: var(--font-size-xs); }
.input-group--error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important; }

textarea {
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
}

.auth-checkbox {
  display: flex; align-items: flex-start; gap: var(--space-sm);
  font-size: var(--font-size-sm); color: var(--text-secondary); cursor: pointer;
  input[type="checkbox"] { accent-color: var(--accent-pink); width: 1.2em; height: 1.2em; margin-top: 2px; flex-shrink: 0; }
  a { color: var(--accent-pink-light); text-decoration: underline; }
}

.auth-message {
  display: flex; align-items: center; gap: var(--space-sm);
  padding: var(--space-md); border-radius: var(--radius-md); font-size: var(--font-size-sm);
  &--error { background: var(--danger-light); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
}

.auth-skip {
  background: transparent; border: none; color: var(--text-muted);
  text-decoration: underline; cursor: pointer; padding: 4px;
  font-size: var(--font-size-sm); align-self: center;
  &:hover { color: var(--text-primary); }
}

.fade-enter-active, .fade-leave-active { transition: all var(--transition-base); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
