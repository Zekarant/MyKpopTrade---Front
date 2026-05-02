<template>
  <main>
    <div class="d-flex align-items-center position-absolute top-0 start-0 p-3 p-md-5 pt-4 logo-container">
      <img src="@/assets/images/logo.png" class="logo-img" alt="Logo" />
      <span class="main-title ms-3">
        MyKpop <br />Trade
      </span>
    </div>
    <div class="container-custom">
      <div class="d-flex flex-column justify-content-center w-50 position-relative">
        <div class="imgcenter column_form">
          <form @submit.prevent="submitForm" class="d-flex flex-column">
            <div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">person</i>
              </span>
              <input
                type="text"
                v-model="username"
                class="form-control border-0"
                :class="{ 'is-invalid': ErroruserName }"
                placeholder="Votre identifiant"
                required
              />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">lock</i>
              </span>
              <input
                type="password"
                v-model="password"
                class="form-control border-0"
                :class="{ 'is-invalid': passwordError }"
                placeholder="Mot de passe"
                required
              />
            </div>
            <button class="btn-primary" aria-label="login" variant="primary">
              Se connecter
            </button>
            <button
              type="button"
              class="btn-google"
              aria-label="Continuer avec Google"
              @click="loginWithGoogle"
            >
              <svg class="google-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.11A6.62 6.62 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.04 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              <span>Continuer avec Google</span>
            </button>
            <a class="registerBtn btn-primary-outline" href="register">S'inscire</a>
            <a style="text-align: center;" href="forgot_psw">Mot de passe oublié</a>
            <br />
            <div
              v-if="ErroruserName || successMessage || passwordError"
              :class="[
                'alert',
                'alert-dismissible',
                'd-flex',
                'align-items-center',
                { 'alert-success': successMessage, 'alert-danger': ErroruserName || passwordError }
              ]"
              role="alert"
            >
              <i class="material-icons me-3">
                {{ ErroruserName || passwordError ? 'error' : 'check' }}
              </i>
              <div>
                {{ ErroruserName || passwordError || successMessage }}
              </div>
            </div>
          </form>
        </div>
      </div>
      <div class="image-column ms-3">
        <img src="@/assets/images/image.png" class="w-100" alt="Image Kpop Exchange" />
      </div>
    </div>
  </main>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import authentificationService from "@/services/authentification.service";

const GOOGLE_ERROR_MESSAGES = {
  google_no_email: "Google n'a pas fourni d'adresse e-mail.",
  google_auth_failed: "La connexion Google a échoué. Réessaie.",
  server_error: "Erreur serveur pendant la connexion Google.",
};

export default defineComponent({
  name: "Login",
  setup() {
    const passwordError = ref("");
    const username = ref("");
    const password = ref("");
    const ErroruserName = ref("");
    const successMessage = ref("");

    const router = useRouter();
    const route = useRoute();

    onMounted(() => {
      const errCode = route.query.error;
      if (typeof errCode === "string" && errCode) {
        ErroruserName.value =
          GOOGLE_ERROR_MESSAGES[errCode] || "Connexion Google indisponible.";
        router.replace({ path: "/login", query: {} });
      }
    });

    const submitForm = async () => {
      let verif_login = true;
      if (username.value === "" || username.value.length < 5) {
        verif_login = false;
        ErroruserName.value = "Le pseudo doit être plus long";
      } else {
        ErroruserName.value = "";
      }
      if (password.value === "") {
        verif_login = false;
        passwordError.value = "Le mot de passe ne peut pas être vide";
      } else {
        passwordError.value = "";
      }
      if (verif_login) {
        try {
          await authentificationService.login(username.value, password.value);
          successMessage.value = "Connexion réussie.";
          router.push("/adherents/dashboard");
        } catch (error) {
          ErroruserName.value = error;
        }
      }
    };

    const loginWithGoogle = () => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      window.location.href = `${apiUrl}/api/auth/google`;
    };

    return {
      username,
      password,
      ErroruserName,
      passwordError,
      successMessage,
      submitForm,
      loginWithGoogle,
    };
  },
});
</script>

<style lang="scss" scoped>
.registerBtn{
  width: 100%;
  text-align:center;
  margin-top: 10px;
  text-decoration: none;
}
.btn-google {
  width: 100%;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  color: #3c4043;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.btn-google:hover {
  box-shadow: 0 1px 3px rgba(60,64,67,0.2);
}
.google-logo {
  width: 18px;
  height: 18px;
}
.container-custom {
  display: flex;
  justify-content: space-between;
  height: 100vh;
  padding: 20px;
}

.main-title {
  color: #121212;
  font-weight: 900;
  text-transform: uppercase;
}

.logo-img {
  max-height: 100px;
}

.image-column {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50%;
}
.column_form{
  width: 65%;
}
.image-column img {
  max-height: 90vh;
  object-fit: contain;
}

.input-group {
  display: flex;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ccc;
  height: 50px;
}

.input-group-text {
  background-color: #fff;
  border: none;
  display: flex;
  align-items: center;
  padding: 0.5rem;
}

.form-control {
  border: none;
  outline: none;
  box-shadow: none;
  padding-left: 0.5rem;
}

.btn-dark {
  background-color: #000;
  color: #fff;
  border-radius: 0;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  text-transform: lowercase;
}

.form-control:focus {
  box-shadow: none;
}

input::placeholder {
  color: #bbb;
}

.input-group-text img {
  height: 1rem;
}

.form-control.is-invalid {
  border-color: var(--danger-color);
}

.text-danger {
  color: var(--danger-color);
}

.text-success {
  color:  var(--success-color);
}

@media only screen and (max-width: 600px) {
  .column_form{
    width: 100%;
  }
  .image-column.ms-3 {
    margin-left: 0px !important;
    padding-bottom: 20px;
  }
  .logo-container {
    position: relative !important;
  }




  .container-custom {
    display: flex;
    flex-direction: column-reverse;
    align-items: center; // Centre les éléments pour mieux gérer l'espace
    height: auto; // Ajuste la hauteur automatiquement
  }

  .image-column {
    width: 100%; // S'assure que le conteneur de l'image occupe toute la largeur
    display: flex;
    justify-content: center;
  }

  .image-column img {
    max-width: 100%; // Limite la largeur de l'image au parent
    height: auto; // Maintient le ratio d'aspect
    max-height: 50vh; // Limite la hauteur pour éviter de prendre trop de place
    object-fit: contain; // S'assure que l'image s'ajuste bien dans son conteneur
  }

  .w-50 {
    width: 100% !important;
  }
}

/****** Responcive ******/
</style>
