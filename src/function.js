import axios from 'axios'; // Ajout de l'import d'axios
import Cookies from 'js-cookie';
import router from './router'

export const func = {
    showToastSuccess(message) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-success';
      alert.innerText = message;
      document.body.appendChild(alert);
      setTimeout(() => {
        alert.remove();
      }, 3000);
    },
    showToastError(message) {
      const alert = document.createElement('div');
      alert.className = 'alert error-alert';
      alert.innerText = message;
      document.body.appendChild(alert);
      setTimeout(() => {
        alert.remove();
      }, 3000);
    }, 
    buildCombinedSlug(query, event) {
      const combined = [query, event].filter(Boolean).join('-');
      return combined;
    },

 }