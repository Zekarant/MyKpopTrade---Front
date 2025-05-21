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
        <div class="ms-lg-5 ms-md-5 centerContent form_content">
          <form @submit.prevent="submitForm" class="d-flex flex-column">
            <div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">account_circle</i>
              </span>
              <input type="name" v-model="username" class="form-control border-0" :class="{ 'is-invalid': nameError }"
                placeholder="Votre pseudo" required />
            </div>
            <!--<div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">account_circle</i>
              </span>
              <input type="name" v-model="firstname" class="form-control border-0" :class="{ 'is-invalid': firstnameError }"
                placeholder="Votre prénom" required />
            </div>-->
            <div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">local_phone</i>
              </span>
              <input type="tel" v-model="tel" class="form-control border-0" :class="{ 'is-invalid': telError }"
                placeholder="Votre numéro de téléphone" required />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text bg-white border-0">
                <i class="material-icons">mail</i>
              </span>
              <input type="email" v-model="email" class="form-control border-0" :class="{ 'is-invalid': emailError }"
                placeholder="Votre mail" required />
            </div>
            <div class="input-group mb-3">
                <span class="input-group-text bg-white border-0">
                    <i class="material-icons">lock</i>
                </span>
              <input type="password" v-model="password" class="form-control border-0" :class="{ 'is-invalid': passwordError }"
              placeholder="Mot de passe" required />
            </div>
            <div class="input-group mb-3">
                <span class="input-group-text bg-white border-0">
                    <i class="material-icons">lock</i>
                </span>
              <input type="password" v-model="password_confirm" class="form-control border-0" :class="{ 'is-invalid': passwordError }"
              placeholder="Confirmer votre mot de passe" required />
            </div>
            <div class="form-check mb-3">
              <input
                class="form-check-input"
                type="checkbox"
                id="privacyPolicy"
                v-model="acceptPolicy"
                :class="{ 'is-invalid': policyError }"
                required
              />
              <label class="form-check-label" for="privacyPolicy">
                J'accepte la <a href="/politique-confidentialite" target="_blank">politique de confidentialité et le traitement des données</a>
              </label>
            </div>
            <div style="color:red; text-align:center">
                {{ emailError || passwordError  || nameError  || telError || errorBase }}
            </div>
            <div v-if="successMessage" :class="['alert', 'alert-dismissible', 'd-flex', 'align-items-center', { 'alert-success': successMessage}]">
                {{ successMessage }}
            </div>

            
            <button class="btn-primary" @click="register" aria-label="register"  variant="primary">S'inscrire</button>
            <a class="loginBtn btn-primary-outline" href="login">Se connecter</a>
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
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';

  export default defineComponent ({
    name: "Register",
    setup() {
      const router = useRouter();
      const errorBase = ref('');
      const successMessage = ref('');
      
      const username = ref('');
      const nameError = ref('');
      
      /*const firstname = ref('');
      const firstnameError = ref('');*/
      
      const tel = ref('');
      const telError = ref('');
      
      const email = ref('');
      const emailError = ref('');
      

      const password = ref('');
      const password_confirm = ref('');
      const passwordError = ref('');
      const acceptPolicy = ref(false);
      const policyError = ref('');

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
        
      };
    }


  });
  </script>
<style lang="scss" scoped>
.loginBtn{
  width: 100%;
  text-align:center;
  text-decoration: none;
  margin-top: 10px;
}
.form_content{
  margin-top: 4em; 
  margin-left:auto !important; 
  width: 70%
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
.form-check-input {
  accent-color: var(--primary-color); /* Pour la plupart des navigateurs modernes */
  width: 1.2em;
  height: 1.2em;
}

/* Pour un style plus personnalisé si besoin */
.form-check-input:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}
@media only screen and (max-width: 600px) {
  .image-column.ms-3 {
    margin-left: 0px !important;
    padding-bottom: 20px;
  }
  .logo-container {
    position: relative !important;
  }

  .form_content{
    margin-top: 0px; 
    margin-left:auto !important; 
    width: 100%
  }


  .container-custom {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    height: auto;
  }

  .image-column {
    width: 100%; 
    display: flex;
    justify-content: center;
  }

  .image-column img {
    max-width: 100%; 
    height: auto; 
    max-height: 50vh; 
    object-fit: contain; 
  }

  .w-50 {
    width: 100% !important;
  }
}

/****** Responcive ******/
</style>
