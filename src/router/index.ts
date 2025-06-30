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
  }, {
    path: '/searchList', 
    name: 'searchList',
    component: searchList,
    props: true

  }, {
    path: '/searchList_bis', 
    name: 'searchList_bis',
    component: searchList_bis,
    props: true

  }
  
];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})


export default router
