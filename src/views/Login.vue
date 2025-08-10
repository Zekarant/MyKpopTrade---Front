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
              <input type="text" v-model="username" class="form-control border-0" :class="{ 'is-invalid': ErroruserName }"
                placeholder="Votre identifiant" required />
            </div>
            <div class="input-group mb-3">
                <span class="input-group-text bg-white border-0">
                    <i class="material-icons">lock</i>
                </span>
              <input type="password" v-model="password" class="form-control border-0" :class="{ 'is-invalid': passwordError }"
              placeholder="Mot de passe" required />
            </div>
            <button class="btn-primary" @click="login" aria-label="login"  variant="primary">Se connecter</button>
            <a class="registerBtn btn-primary-outline" href="register">S'inscire</a>
            <a style="text-align: center;" href="forgot_psw">Mot de passe oublié</a>
            <br>
            <div v-if="ErroruserName || successMessage || passwordError"
              :class="['alert', 'alert-dismissible', 'd-flex', 'align-items-center', { 'alert-success': successMessage, 'alert-danger': ErroruserName }]"
              role="alert">
              <i class="material-icons me-3">
                {{ ErroruserName | passwordError ? 'error' : 'check' }}
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
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  import Cookies from 'js-cookie';

  export default defineComponent ({
    name: "Login",
    setup() {
      var passwordError = ref('');
      var username = ref('');
      var password = ref('');
      var ErroruserName = ref('');
      var usernameError = ref('');
      var errorBase = ref('');
      var successMessage = ref('');
      
      
      const router = useRouter();

      const login = async () => {
        var verif_login = true;

        if(username.value == '' || username.value.length < 5) {
          verif_register = false;
          ErroruserName.value  = 'Le pseudo doit être plus long';
        } else {
          ErroruserName.value = '';
        }
        if(password.value == '') {
          verif_register = false;
          passwordError.value  = 'Le mot de passe ne peut pas être vide';
        } else {
          passwordError.value = '';
        }
        if(verif_login){
          await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
              identifier: username.value,
              password: password.value,
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(response => {
              console.log(response);
              if (response.status === 200) {
              Cookies.set('sessionToken', response.data.accessToken, { expires: 15 / 1440 });
              Cookies.set('refreshToken', response.data.refreshToken, { expires: 1 })
              Cookies.set('id_user', response.data.user.id, { expires: 1 });
              sessionStorage.removeItem('favorites');
              router.push('/adherents/dashboard');

            } else {
              ErroruserName.value = response.data.message;
            }
          }).catch(error => {
            console.log(error);
            ErroruserName.value = error.response.data.message;

          });





        }
      }
      return {
        login,
        passwordError,
        username,
        ErroruserName,
        errorBase,
        successMessage,
        password,
        
      };
    }


  });
  </script>
<style lang="scss" scoped>
.registerBtn{
  width: 100%;
  text-align:center;
  margin-top: 10px;
  text-decoration: none;
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
