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
    renderUserAvatar(dataUser) {
      const { username, profilePicture } = dataUser;
      if (profilePicture && profilePicture.trim() !== "" &&  profilePicture.trim() !== "https://mykpoptrade.com/images/avatar-default.png") {
        return `
           <img src="${import.meta.env.VITE_API_URL}${profilePicture}" alt="${username}" style="width: 100%; height: 100%; object-fit: cover;" />
        `;
      } else {
        const firstLetter = username?.charAt(0).toUpperCase() || "?";
        return `
          <div style="
            width: 100%;
            height: 100%;
            object-fit: contain;
            background-color: var(--primary-color);
            border-radius: 3px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
          ">
            ${firstLetter}
          </div>
        `;
      }
    }

 }