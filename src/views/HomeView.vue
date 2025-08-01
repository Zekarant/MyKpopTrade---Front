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
        <div class="ms-lg-5 ms-md-5">
          <h1 class="mt-3 text-md-center text-start text-uppercase fw-bold">
            Ouverture prochainement
          </h1>
          <hr>
          <p class="text-justify">MyKpopTrade est un site de vente et d'échange de cartes de K-Pop. Pour
            l'instant, le projet est en cours de construction. Si vous souhaitez être au courant de l'avancée du projet,
            n'hésitez pas à renseigner votre mail ci-dessous !</p>
          <form @submit.prevent="submitForm" class="d-flex flex-column">
            <div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">mail</i>
              </span>
              <input type="email" v-model="email" class="form-control border-0" :class="{ 'is-invalid': emailError }"
                placeholder="Votre mail" required />
              <button class="btn btn-dark text-lowercase" type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Envoi...' : 'envoyer' }}
              </button>
            </div>
            <div v-if="emailError || successMessage"
              :class="['alert', 'alert-dismissible', 'd-flex', 'align-items-center', { 'alert-success': successMessage, 'alert-danger': emailError }]"
              role="alert">
              <i class="material-icons me-3">
                {{ emailError ? 'error' : 'check' }}
              </i>
              <div>
                {{ emailError || successMessage }}
              </div>
              <button type="button" class="btn-close" @click="clearMessage" aria-label="Close"></button>
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

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';


export default defineComponent({
  name: 'HomeView',
  setup() {
    var email = ref('');
    var emailError = ref('');
    var successMessage = ref('');
    var isSubmitting = ref(false);

    const submitForm = async () => {
      emailError.value = '';
      successMessage.value = '';
      isSubmitting.value = true;

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/add-email`, {
          email: email.value,
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });


        if (response.status === 201) {
          successMessage.value = 'Email ajouté avec succès';
          email.value = ''; // Réinitialiser le champ email
        } else {
          emailError.value = response.data.message || 'Une erreur est survenue. Veuillez réessayer.';
        }
      } catch (error: any) {
        if (error.response && error.response.data) {
          emailError.value = error.response.data.message || 'Une erreur est survenue. Veuillez réessayer.';
        } else {
          emailError.value = 'Une erreur est survenue. Veuillez réessayer.';
        }
      } finally {
        isSubmitting.value = false; // Réinitialiser l'état de soumission
      }
    };

    const clearMessage = () => {
      emailError.value = '';
      successMessage.value = '';
    };

    return {
      email,
      emailError,
      successMessage,
      isSubmitting,
      submitForm,
      clearMessage,
    };
  },
});
</script>

<style lang="scss" scoped>
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
  color: var(--success-color);
}

@media only screen and (max-width: 600px) {

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
