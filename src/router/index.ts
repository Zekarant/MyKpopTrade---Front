import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import forgot_psw from '../views/forgot_psw.vue';
import searchList from '../views/adherents/searchList.vue';
import searchList_bis from '../views/adherents/searchList_bis.vue';
import Dashboard from '@p_v/dashboard.vue';
import Test from '../views/test.vue';
import Collection from '@p_v/collection.vue';
import profile from '@p_v/profile.vue';
import messaging from '@p_v/messaging.vue';
import add_poste from '@p_v/add_poste.vue';


const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  { path: '/login', 
    name: 'login',
    component: Login 
  },
  { path: '/register', 
    name: 'register',
    component: Register 
  },
  { 
    path: '/adherents/dashboard', 
    name: 'dashboard',
    component: Dashboard 
  },  
  { 
    path: '/adherents/collection', 
    name: 'collection',
    component: Collection 
  },
  { 
    path: '/adherents/profile/:id', 
    name: 'profile',
    component: profile 
  },
  {
    path: '/forgot_psw', 
    name: 'forgot_psw',
    component: forgot_psw 
  },
{
  path: '/search-:combined?',
  name: 'searchList',
  component: searchList,
  props: (route: { params: { combined: any; }; }) => {
    const combined = route.params.combined || '';
    const parts = combined.split('-');

    let query = '';
    let event = '';

    if (combined === '') {
      query = '';
      event = '';
    } else if (parts.length === 1) {
      // Une seule partie => soit query soit event
      // Tu peux définir une liste des events connus pour distinguer
      const knownEvents = ['morePage', 'search', 'morePageFavorites'];
      if (knownEvents.includes(parts[0])) {
        query = '';
        event = parts[0];
      } else {
        query = parts[0];
        event = '';
      }
    } else {
      // 2 parties ou plus
      query = parts[0] || '';
      event = parts[parts.length - 1] || '';
    }

    return { query, event };
  }
},{
    path: '/searchList_bis', 
    name: 'searchList_bis',
    component: searchList_bis,
    props: true

  },{
    path: '/messaging', 
    name: 'messaging',
    component: messaging,
    props: true

  },{
    path: '/adherents/new', 
    name: 'add_poste',
    component: add_poste,
    props: true

  }
  
];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})


export default router
