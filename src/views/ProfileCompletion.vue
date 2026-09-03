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
              <label class="form-label">Pseudo <span class="required">*</span></label>
              <div class="input-group--custom" :class="{ 'input-group--error': usernameError }">
                <span class="input-icon"><i class="bi bi-person"></i></span>
                <input v-model.trim="form.username" type="text" maxlength="30" autocomplete="username" />
              </div>
              <small v-if="usernameError" class="hint hint--error">{{ usernameError }}</small>
              <small v-else class="hint">
                C'est le nom sous lequel les autres membres te verront. Modifiable à tout moment
                depuis tes paramètres.
              </small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Prénom</label>
                <div class="input-group--custom">
                  <span class="input-icon"><i class="bi bi-person-vcard"></i></span>
                  <input v-model.trim="form.firstName" type="text" maxlength="100" autocomplete="given-name" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Nom</label>
                <div class="input-group--custom">
                  <input v-model.trim="form.lastName" type="text" maxlength="100" autocomplete="family-name" />
                </div>
              </div>
            </div>
            <small class="hint">
              <i class="bi bi-lock"></i> Restent privés : jamais affichés sur ton profil public.
            </small>

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
              <span>
                J'accepte les
                <router-link to="/cgu" target="_blank">CGU</router-link>
                et la
                <router-link to="/privacy" target="_blank">politique de confidentialité</router-link>
                <span class="required">*</span>
              </span>
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
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
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
      firstName: '',
      lastName: '',
      phoneNumber: '',
      bio: '',
      location: '',
      privacyPolicyAccepted: false,
      marketingConsent: false,
    });

    /** Validation locale du pseudo, alignée sur `validateUsername` côté API. */
    const usernameError = computed(() => {
      const username = form.username;
      if (!username) return 'Le pseudo est obligatoire.';
      if (username.length < 3) return 'Au moins 3 caractères.';
      if (username.length > 30) return '30 caractères maximum.';
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return 'Lettres, chiffres, tiret et underscore uniquement.';
      }
      return '';
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
        if (data.user?.profileCompleted) {
          // Déjà rempli — on n'est pas censé être ici.
          router.replace('/adherents/dashboard');
          return;
        }
        // Pré-remplissage depuis le fournisseur OAuth : le pseudo est déjà
        // dérivé du nom du compte, l'utilisateur n'a qu'à le valider ou
        // l'ajuster. Le champ est rempli, pas seulement suggéré en placeholder,
        // pour que « Terminer » fonctionne sans saisie supplémentaire.
        defaultUsername.value = data.user?.username || '';
        form.username = defaultUsername.value;
        form.firstName = data.user?.firstName || '';
        form.lastName = data.user?.lastName || '';
      } catch {
        router.replace('/login');
      }
    });

    const submit = async () => {
      errorMessage.value = '';
      errors.phoneNumber = undefined;
      if (usernameError.value) {
        errorMessage.value = usernameError.value;
        return;
      }
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
            username: form.username,
            firstName: form.firstName,
            lastName: form.lastName,
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

    return { form, errors, errorMessage, loading, defaultUsername, usernameError, submit, skip };
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}
.required { color: var(--accent-pink); }
.hint {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.5;

  &--error { color: var(--danger); font-weight: 500; }
}

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
}
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
