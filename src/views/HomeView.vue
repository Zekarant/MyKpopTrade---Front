<template>
  <main class="landing">
    <div class="landing__bg">
      <div class="landing__orb landing__orb--pink"></div>
      <div class="landing__orb landing__orb--purple"></div>
    </div>

    <header class="landing__header">
      <div class="landing__brand">
        <img src="@/assets/images/logo.png" alt="Logo" class="landing__logo" />
        <span class="landing__brand-name">MyKpop<br/>Trade</span>
      </div>
      <router-link to="/login" class="landing__login-btn">
        <i class="bi bi-box-arrow-in-right"></i> Connexion
      </router-link>
    </header>

    <section class="landing__hero">
      <div class="landing__hero-content">
        <h1 class="landing__title">
          La marketplace <span class="text-accent">K-Pop</span> pour les collectionneurs
        </h1>
        <p class="landing__subtitle">
          Achetez, vendez et échangez vos photocards, albums et goodies dans un espace sécurisé et pensé pour les fans.
        </p>

        <!-- Formulaire d'inscription -->
        <div class="landing__register-card">
          <h2 class="landing__register-title">Créer un compte</h2>
          <form @submit.prevent="register" class="landing__register-form">
            <div class="landing__input-group">
              <i class="bi bi-person"></i>
              <input type="text" v-model="username" placeholder="Pseudo" required />
            </div>
            <div class="landing__input-group">
              <i class="bi bi-phone"></i>
              <input type="tel" v-model="tel" placeholder="Téléphone" required />
            </div>
            <div class="landing__input-group">
              <i class="bi bi-envelope"></i>
              <input type="email" v-model="email" placeholder="Adresse email" required />
            </div>
            <div class="landing__input-group">
              <i class="bi bi-lock"></i>
              <input type="password" v-model="password" placeholder="Mot de passe" required />
            </div>
            <div class="landing__input-group">
              <i class="bi bi-lock-fill"></i>
              <input type="password" v-model="password_confirm" placeholder="Confirmer le mot de passe" required />
            </div>

            <div class="landing__beta-notice">
              <span class="landing__beta-tag">BÊTA</span>
              <p>
                MyKpopTrade est en version bêta : bugs, interruptions et réinitialisations de données
                possibles. Service fourni « en l'état », sans garantie.
                <router-link to="/beta" target="_blank">En savoir plus</router-link>
              </p>
            </div>

            <label class="landing__checkbox">
              <input type="checkbox" v-model="acceptBeta" />
              <span>Je comprends que MyKpopTrade est en bêta et j'utilise le service à mes risques.</span>
            </label>

            <label class="landing__checkbox">
              <input type="checkbox" v-model="acceptPolicy" />
              <span>
                J'accepte les <router-link to="/cgu" target="_blank">CGU</router-link>
                et la <router-link to="/privacy" target="_blank">politique de confidentialité</router-link>.
              </span>
            </label>

            <!-- Consentement marketing : RGPD art. 4(11) et 7(4) — spécifique,
                 libre et décoché par défaut. Il était codé en dur à `true`. -->
            <label class="landing__checkbox">
              <input type="checkbox" v-model="acceptMarketing" />
              <span>
                J'accepte de recevoir les actualités et bons plans de MyKpopTrade par email.
                <em>(facultatif, révocable à tout moment)</em>
              </span>
            </label>

            <Transition name="fade">
              <div v-if="registerError" class="landing__msg landing__msg--error">
                <i class="bi bi-exclamation-circle"></i> {{ registerError }}
              </div>
            </Transition>
            <Transition name="fade">
              <div v-if="successMessage" class="landing__msg landing__msg--success">
                <i class="bi bi-check-circle"></i> {{ successMessage }}
              </div>
            </Transition>

            <button type="submit" class="landing__register-btn">
              <i class="bi bi-rocket-takeoff"></i> S'inscrire gratuitement
            </button>
          </form>

          <div class="landing__register-footer">
            <span>Déjà un compte ?</span>
            <router-link to="/login" class="landing__login-link">Se connecter</router-link>
          </div>
        </div>
      </div>

      <div class="landing__hero-visual">
        <img src="@/assets/images/image.png" alt="K-Pop cards" class="landing__hero-img" />
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'HomeView',
  setup() {
    const router = useRouter();
    const username = ref('');
    const tel = ref('');
    const email = ref('');
    const password = ref('');
    const password_confirm = ref('');
    const acceptPolicy = ref(false);
    const acceptBeta = ref(false);
    // Décoché par défaut : un consentement pré-coché n'est pas un consentement.
    const acceptMarketing = ref(false);
    const registerError = ref('');
    const successMessage = ref('');

    const register = async () => {
      registerError.value = '';
      successMessage.value = '';

      if (!username.value || username.value.length < 5) {
        registerError.value = 'Le pseudo doit faire au moins 5 caractères.';
        return;
      }
      if (!tel.value || tel.value.length < 5) {
        registerError.value = 'Numéro de téléphone invalide.';
        return;
      }
      if (!email.value || email.value.length < 5) {
        registerError.value = 'Email invalide.';
        return;
      }
      if (!password.value || !password_confirm.value) {
        registerError.value = 'Les mots de passe ne peuvent pas être vides.';
        return;
      }
      if (password.value !== password_confirm.value) {
        registerError.value = 'Les mots de passe ne correspondent pas.';
        return;
      }
      if (!acceptBeta.value) {
        registerError.value = 'Vous devez reconnaître que le service est en version bêta.';
        return;
      }
      if (!acceptPolicy.value) {
        registerError.value = 'Vous devez accepter les CGU et la politique de confidentialité.';
        return;
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
          email: email.value,
          username: username.value,
          numberPhone: tel.value,
          password: password.value,
          confirmPassword: password_confirm.value,
          privacyPolicy: true,
          dataProcessing: true,
          marketing: acceptMarketing.value
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response.status === 201) {
          successMessage.value = 'Inscription réussie ! Redirection...';
          setTimeout(() => router.push('/login'), 1500);
        } else {
          registerError.value = response.data.message || 'Une erreur est survenue.';
        }
      } catch (error: any) {
        registerError.value = error.response?.data?.message || 'Une erreur est survenue.';
      }
    };

    return {
      username, tel, email, password, password_confirm,
      acceptPolicy, acceptBeta, acceptMarketing, registerError, successMessage, register
    };
  },
});
</script>

<style lang="scss" scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding: var(--space-lg);
}

.landing__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.landing__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.3;
}
.landing__orb--pink {
  width: 500px; height: 500px;
  background: var(--accent-pink);
  top: -150px; right: -100px;
}
.landing__orb--purple {
  width: 400px; height: 400px;
  background: var(--accent-purple);
  bottom: -100px; left: -100px;
}

.landing__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
  margin-bottom: var(--space-lg);
}

.landing__brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.landing__logo { height: 48px; }
.landing__brand-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  line-height: 1.1;
  text-transform: uppercase;
  color: var(--text-primary);
}

.landing__login-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--bg-card);
  border: 1.5px solid var(--surface-border);
  border-radius: var(--radius-full);
  color: var(--text-primary);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--accent-pink);
    color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }
}

.landing__hero {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xxl);
  position: relative;
  z-index: 1;
}

.landing__hero-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.landing__title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: var(--space-sm);
}

.landing__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
  max-width: 480px;
}

/* Register card */
.landing__register-card {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  width: 100%;
  max-width: 420px;
  align-self: center;
}

.landing__register-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}

.landing__register-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.landing__input-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1.5px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:focus-within {
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.08);
  }

  i {
    color: var(--text-muted);
    font-size: 1rem;
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 12px 0;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-family: var(--font-sans);

    &::placeholder { color: var(--text-muted); }
  }
}

.landing__beta-notice {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-xs);
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
    color: var(--accent-pink-light);
    font-weight: 600;
    text-decoration: underline;
    white-space: nowrap;
    &:hover { color: var(--accent-pink); }
  }
}

.landing__beta-tag {
  flex-shrink: 0;
  height: fit-content;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--warning);
  border: 1px solid var(--warning);
  border-radius: var(--radius-full);
  padding: 1px 8px;
}

.landing__checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-xs);

  input[type="checkbox"] {
    margin-top: 2px;
    accent-color: var(--accent-pink);
  }

  a {
    color: var(--accent-pink-light);
    text-decoration: underline;
    &:hover { color: var(--accent-pink); }
  }
}

.landing__register-btn {
  width: 100%;
  padding: 14px;
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: var(--font-size-base);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  transition: all var(--transition-fast);
  box-shadow: 0 4px 16px rgba(255, 45, 120, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(255, 45, 120, 0.4);
  }
}

.landing__register-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--surface-border);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.landing__login-link {
  color: var(--accent-pink);
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.landing__msg {
  font-size: var(--font-size-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.landing__msg--error {
  background: var(--danger-light);
  color: var(--danger);
}
.landing__msg--success {
  background: var(--success-light);
  color: var(--success);
}

.landing__hero-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.landing__hero-img {
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .landing__hero {
    flex-direction: column-reverse;
    text-align: center;
    gap: var(--space-lg);
  }
  .landing__subtitle { margin-inline: auto; }
  .landing__hero-img { max-height: 30vh; }
  .landing__register-card { max-width: 100%; }
}
</style>
