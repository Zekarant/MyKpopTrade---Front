import axios from 'axios'; // Ajout de l'import d'axios
import Cookies from 'js-cookie';
import router from './router'

export const func = {
    logout: async () => {
      try {
        const refreshToken = Cookies.get('refreshToken');
        const sessionToken = Cookies.get('sessionToken');
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
            refreshToken: refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`

          }
        });

        if(response.status === 200) {
          Cookies.remove('sessionToken');
          document.cookie = 'sessionToken=; expires=expires=Thu, 01 Jan 1970 00:00:01 GMT';
          Cookies.remove('refreshToken');
        }
        router.push('/login');
      } catch (error) {
        router.push('/login');
        Cookies.remove('sessionToken');
        document.cookie = 'sessionToken=; expires=expires=Thu, 01 Jan 1970 00:00:01 GMT';
        Cookies.remove('refreshToken');
      }


    },
    verifSession: async () => {
      const sessionToken = Cookies.get('sessionToken');
      if(!sessionToken){
        func.logout();
      }else{
        try {
          const refreshToken = Cookies.get('refreshToken');
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, {
            refreshToken: refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            }
          });
          if(response.status === 200) {
            Cookies.set('sessionToken', response.data.accessToken, { expires: 1 });
            Cookies.set('refreshToken', response.data.refreshToken, { expires: 1 });
          }else{
            this.$func.logout();
          }
          } catch (error) {
            console.error('Erreur lors de la déconnexion :', error);
          }
        }
        return;
    },
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