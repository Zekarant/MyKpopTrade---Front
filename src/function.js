import Cookies from 'js-cookie';
import router from './router'

export const func = {
    logout: () => {
        document.cookie = 'PHPSESSID=; expires=expires=Thu, 01 Jan 1970 00:00:01 GMT';
        Cookies.remove('PHPSESSID');
        router.push('/login');

    },
 }