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
