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
              <p class="auth-brand__subtitle">Rejoins la communauté K-pop</p>
            </div>
          </div>

          <form @submit.prevent="register" class="auth-form">
            <!-- Username -->
            <div class="form-group">
              <label class="form-label">Pseudo</label>
              <div class="input-group--custom" :class="{ 'input-group--error': nameError }">
                <span class="input-icon"><i class="bi bi-person"></i></span>
                <input type="text" v-model="username" placeholder="Ton pseudo" required />
              </div>
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <div class="input-group--custom" :class="{ 'input-group--error': telError }">
                <span class="input-icon"><i class="bi bi-phone"></i></span>
                <input type="tel" v-model="tel" placeholder="Numéro de téléphone" required />
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-group--custom" :class="{ 'input-group--error': emailError }">
                <span class="input-icon"><i class="bi bi-envelope"></i></span>
                <input type="email" v-model="email" placeholder="Ton adresse email" required />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="form-label">Mot de passe</label>
              <div class="input-group--custom" :class="{ 'input-group--error': passwordError }">
                <span class="input-icon"><i class="bi bi-lock"></i></span>
                <input type="password" v-model="password" placeholder="Mot de passe" required />
              </div>
            </div>

            <!-- Confirm password -->
            <div class="form-group">
              <label class="form-label">Confirmation</label>
              <div class="input-group--custom" :class="{ 'input-group--error': passwordError }">
                <span class="input-icon"><i class="bi bi-lock"></i></span>
                <input type="password" v-model="password_confirm" placeholder="Confirmer le mot de passe" required />
              </div>
            </div>

            <!-- Policy checkbox -->
            <label class="auth-checkbox">
              <input type="checkbox" v-model="acceptPolicy" :class="{ 'is-invalid': policyError }" />
              <span>J'accepte la <a href="/politique-confidentialite" target="_blank">politique de confidentialité</a></span>
            </label>

            <!-- Errors -->
            <Transition name="fade">
              <div v-if="emailError || passwordError || nameError || telError || errorBase || policyError"
                class="auth-message auth-message--error">
                <i class="bi bi-exclamation-circle"></i>
                <span>{{ emailError || passwordError || nameError || telError || errorBase || policyError }}</span>
              </div>
            </Transition>

            <Transition name="fade">
              <div v-if="successMessage" class="auth-message auth-message--success">
                <i class="bi bi-check-circle"></i>
                <span>{{ successMessage }}</span>
              </div>
            </Transition>

            <button class="btn btn-primary w-full" type="submit">S'inscrire</button>

            <!-- Divider -->
            <div class="auth-divider">
              <span>ou s'inscrire avec</span>
            </div>

            <!-- Social buttons -->
            <div class="auth-social">
              <button type="button" class="auth-social__btn" @click="registerWithGoogle">
                <svg class="auth-social__icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.11A6.62 6.62 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.04 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Google
              </button>
              <button type="button" class="auth-social__btn auth-social__btn--discord" @click="registerWithDiscord">
                <svg class="auth-social__icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.074.074 0 0 0-.079.037c-.34.6-.719 1.384-.984 2.001a18.27 18.27 0 0 0-5.487 0 12.65 12.65 0 0 0-1-2.001.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 5.17 4.369a.07.07 0 0 0-.032.027C1.533 9.795.546 15.06 1.03 20.262a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.027 14.2 14.2 0 0 0 1.226-1.994.076.076 0 0 0-.041-.105 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-6.012-.838-11.232-3.549-15.866a.06.06 0 0 0-.031-.028zM8.02 17.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </button>
            </div>

            <!-- Links -->
            <div class="auth-links">
              <router-link to="/login" class="auth-links__item">
                Déjà un compte ? <strong>Se connecter</strong>
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
  <script>
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';

  export default defineComponent ({
    name: "Register",
    setup() {
      const router = useRouter();
      var errorBase = ref('');
      var successMessage = ref('');

      var username = ref('');
      var nameError = ref('');

      /*const firstname = ref('');
      const firstnameError = ref('');*/

      var tel = ref('');
      var telError = ref('');

      var email = ref('');
      var emailError = ref('');


      var password = ref('');
      var password_confirm = ref('');
      var passwordError = ref('');
      var acceptPolicy = ref(false);
      var policyError = ref('');

      const register = async () => {
        nameError.value = '';
        successMessage.value = '';

        //firstnameError.value = '';
        telError.value = '';
        emailError.value = '';
        passwordError.value = '';


        var verif_register = true;
        if(username.value == '' || username.value.length < 5) {
          verif_register = false;
          nameError.value  = 'Le pseudo doit être plus long';
        }
        policyError.value = '';
        if (!acceptPolicy.value) {
          policyError.value = 'Vous devez accepter la politique de confidentialité.';
          return;
        }
        /*if(firstname.value == '' || firstname.value.length < 5) {
          verif_register = false;
          firstnameError.value  = 'Le prénom doit être plus long';
        } */
        if(tel.value == '' || tel.value.length < 5) {
          verif_register = false;
          telError.value  = 'Le numéro de téléphone est invalide';
        }
        if(email.value == '' || email.value.length < 5) {
          verif_register = false;
          emailError.value  = 'L\'email est invalide';
        }


        if(password.value == '' || password_confirm.value == '') {
          verif_register = false;
          passwordError.value  = 'Le mot de passe ne peut pas être vide';
        }
        /*if(password_confirm.value != password.value){
          verif_register = false;
          passwordError.value = "Les mots de passe sont différents";
        }*/

        if(verif_register){
          await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
            email: email.value,
            //firstname: firstname.value,
            username: username.value,
            numberPhone: tel.value,
            password: password.value,
            confirmPassword: password_confirm.value,
            privacyPolicy:verif_register,
            dataProcessing: verif_register,
            marketing: verif_register

          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(response => {
            if (response.status === 201) {
            successMessage.value = 'Inscription réussie !';
            setTimeout(() => {
              router.push('/login');
            }, 1000);
          } else {
            emailError.value = response.data.message || 'Une erreur est survenue. Veuillez réessayer.';
          }
          }).catch(error => {
            emailError.value = error.response.data.message || 'Une erreur est survenue. Veuillez réessayer.';

          });


        }
      }
      const registerWithGoogle = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
      };
      const registerWithDiscord = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/discord`;
      };

      return {
        register,
        passwordError,
        username,
        nameError,
        //firstname,
        //firstnameError,
        tel,
        telError,
        email,
        emailError,
        errorBase,
        successMessage,
        password,
        password_confirm,
        acceptPolicy,
        policyError,
        registerWithGoogle,
        registerWithDiscord,
      };
    }


  });
  </script>
<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
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
  margin-bottom: var(--space-xl);
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.input-group--error {
  border-color: var(--danger) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.auth-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;

  input[type="checkbox"] {
    accent-color: var(--accent-pink);
    width: 1.2em;
    height: 1.2em;
    margin-top: 2px;
    flex-shrink: 0;
  }

  a {
    color: var(--accent-pink-light);
    text-decoration: underline;
  }
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

.auth-divider {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-sm) 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--surface-border);
  }

  span {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    white-space: nowrap;
  }
}

.auth-social {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.auth-social__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-elevated);
    border-color: var(--text-muted);
    transform: translateY(-1px);
  }

  &--discord {
    color: #5865F2;
  }
}

.auth-social__icon {
  width: 18px;
  height: 18px;
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

  &:hover { color: var(--accent-pink); }

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
