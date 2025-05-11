import axios from 'axios'; // Ajout de l'import d'axios
import Cookies from 'js-cookie';
import router from './router'

export const func = {
    logout: async () => {
      console.log('logout');
      try {
        const refreshToken = Cookies.get('refreshToken');

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
        router.push('/login');
        
      }


    },
 }