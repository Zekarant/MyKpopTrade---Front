import { createRouter, createWebHistory, type RouteLocationGeneric } from 'vue-router'
import Cookies from 'js-cookie'
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import forgot_psw from '../views/forgot_psw.vue';


const routes = [
  // `/settings` est la cible des redirections OAuth côté API.
  {
    path: '/settings',
    redirect: (to: RouteLocationGeneric) => ({
      path: '/adherents/settings',
      query: to.query
    })
  },
  {
    path: '/parametres',
    redirect: '/adherents/settings'
  },
  {
    path: '/vendre',
    redirect: '/adherents/new'
  },
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
    path: '/auth/callback',
    name: 'auth_callback',
    component: () => import('@/views/AuthCallback.vue'),
    meta: { title: 'Connexion…' },
  },
  { path: '/register',
    name: 'register',
    component: Register
  },
  {
    path: '/profile-completion',
    name: 'profile_completion',
    component: () => import('@/views/ProfileCompletion.vue'),
    meta: { title: 'Finaliser ton profil' }
  },
  {
    path: '/adherents/dashboard',
    name: 'dashboard',
    component: () => import('@p_v/dashboard.vue')
  },
  {
    path: '/adherents/admin',
    name: 'admin',
    component: () => import('@/views/admin/admin.vue')
  },
{
    path: '/payment/cancel',
    name: 'payment_cancel',
    component: () => import('@/views/payment/cancel.vue'),
    meta: {
      title: 'Paiement annulé'
    }
  },
  {
    path: '/payment/success',
    name: 'payment_success',
    component: () => import('@/views/payment/success.vue'),
    meta: {
      title: 'Paiement confirmé'
    }
  },
    {
    path: '/adherents/',
    name: 'adherents',
    component: () => import('@p_v/dashboard.vue')
  },
  {
    path: '/adherents/collection',
    name: 'collection',
    component: () => import('@p_v/collection.vue')
  },
  {
    path: '/adherents/profile/:id',
    name: 'profile',
    component: () => import('@p_v/profile.vue')
  },
  {
    path: '/adherents/settings',
    name: 'settings',
    component: () => import('@p_v/settings.vue'),
    meta: { requiresAuth: true, title: 'Paramètres' }
  },
  {
    path: '/adherents/payments',
    name: 'payments',
    component: () => import('@p_v/payments.vue'),
    meta: { requiresAuth: true, title: 'Mes paiements' }
  },
  {
    path: '/forgot_psw',
    name: 'forgot_psw',
    component: forgot_psw
  },
{
  path: '/search-:combined?',
  name: 'searchList',
  component: () => import('../views/adherents/searchList.vue'),
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
      const knownEvents = ['morePage', 'search', 'morePageFavorites', 'moreFavorites'];
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
},
  {
    path: '/adherents/messages',
    name: 'messages',
    component: () => import('@/views/messaging/MessagesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Messages'
    },
    children: [
      {
        path: '',
        name: 'messages-list',
        component: () => import('@/components/messaging/ConversationList.vue')
      },
      {
        path: ':id',
        name: 'conversation',
        component: () => import('@/components/messaging/ConversationDetail.vue'),
        props: true
      }
    ]
  },
  {
    path: '/negotiate/:productId',
    name: 'negotiate',
    component: () => import('@/views/messaging/NegotiateView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Négocier'
    }
  },{
    path: '/adherents/new',
    name: 'add_post',
    component: () => import('@p_v/add_post.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Vendre un article' }
  },
  {
    path: '/adherents/modify',
    name: 'modify_post',
    component: () => import('@p_v/add_post.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Modifier l\'annonce' }
  },
  {
    path: '/adherents/review/:id',
    name: 'add_review',
    component: () => import('@p_v/add_review.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Ajouter un avis'
    }
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/contact.vue'),
    meta: {
      title: 'Nous contacter'
    }
  },
  {
    path: '/disputes',
    name: 'disputes',
    component: () => import('@/views/disputes/DisputesList.vue'),
    meta: { requiresAuth: true, title: 'Mes litiges' }
  },
  {
    path: '/disputes/:id',
    name: 'dispute_detail',
    component: () => import('@/views/disputes/DisputeDetail.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Litige' }
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/cart/CartView.vue'),
    meta: { requiresAuth: true, title: 'Mon panier' }
  },
  {
    path: '/cgu',
    name: 'cgu',
    component: () => import('@/views/legal/Cgu.vue'),
    meta: { title: 'Conditions Générales d\'Utilisation' }
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@/views/legal/Privacy.vue'),
    meta: { title: 'Politique de confidentialité' }
  },
  {
    path: '/legal',
    name: 'legal',
    component: () => import('@/views/legal/Legal.vue'),
    meta: { title: 'Mentions légales' }
  },
  {
    path: '/cookies',
    name: 'cookies',
    component: () => import('@/views/legal/Cookies.vue'),
    meta: { title: 'Politique cookies' }
  },
  {
    path: '/beta',
    name: 'beta',
    component: () => import('@/views/legal/Beta.vue'),
    meta: { title: 'À propos de la bêta' }
  },
  {
    path: '/faq',
    name: 'faq',
    component: () => import('@/views/legal/Faq.vue'),
    meta: { title: 'FAQ' }
  }


];



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

/**
 * Pages réservées aux visiteurs non connectés. Le refresh token (cookie de
 * 7 jours) fait foi : tant qu'il est présent, la session peut être rétablie,
 * donc on renvoie l'utilisateur vers son tableau de bord plutôt que de lui
 * réafficher l'accueil ou l'écran de connexion.
 */
const GUEST_ONLY_ROUTES = new Set(['home', 'login', 'register'])

router.beforeEach((to) => {
  const hasSession = Boolean(Cookies.get('refreshToken'))

  if (hasSession && typeof to.name === 'string' && GUEST_ONLY_ROUTES.has(to.name)) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = typeof title === 'string' ? `${title} · MyKpopTrade` : 'MyKpopTrade'
})



export default router

