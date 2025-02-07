import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
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
    path: '/adherents/profile:id', 
    name: 'profile',
    component: profile 
  },
  {
    path: '/test', 
    name: 'test',
    component: Test 
  }

];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})


export default router
