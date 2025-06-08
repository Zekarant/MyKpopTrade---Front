import axios from 'axios'; // Ajout de l'import d'axios
import Cookies from 'js-cookie';
import router from './router'

export const func = {
    logout: async () => {
      console.log('logout');
      try {
        const refreshToken = Cookies.get('refreshToken');
        const PHPSESSID = Cookies.get('PHPSESSID');
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
            refreshToken: refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PHPSESSID}`

          }
        });
        console.log(response.status);

        if(response.status === 200) {
          Cookies.remove('PHPSESSID');
          document.cookie = 'PHPSESSID=; expires=expires=Thu, 01 Jan 1970 00:00:01 GMT';
          Cookies.remove('refreshToken');
        }
        router.push('/login');
      } catch (error) {
        console.error('Erreur lors de la déconnexion :', error);
      }


    },
    verifSession: async () => {
      const PHPSESSID = Cookies.get('PHPSESSID');
      console.log(PHPSESSID);
      if(!PHPSESSID){
        this.$func.logout();
      }else{
        try {
          const refreshToken = Cookies.get('refreshToken');
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, {
            refreshToken: refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${PHPSESSID}`
            }
          });
          console.log(response.status);

          if(response.status === 200) {
            Cookies.set('PHPSESSID', response.data.accessToken, { expires: 1 });
            Cookies.set('refreshToken', response.data.refreshToken, { expires: 1 });
          }else{
            console.log(response);
            this.$func.logout();
          }
          } catch (error) {
            console.error('Erreur lors de la déconnexion :', error);
          }
        }
        return;
    },
 }