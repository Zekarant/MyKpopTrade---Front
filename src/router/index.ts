import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue';


const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  { path: '/login', component: Login }

];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})


export default router
