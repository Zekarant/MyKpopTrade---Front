import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue';
import Dashboard from '../views/adherents/dashboard.vue';
import Test from '../views/test.vue';


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
  { 
    path: '/adherents/dashboard', 
    name: 'dashboard',
    component: Dashboard 
  },
  {
    path: '/test', 
    name: 'test',
    component: Test }

];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})


export default router
