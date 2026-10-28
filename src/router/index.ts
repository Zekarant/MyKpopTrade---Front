import { createRouter, createWebHistory, type RouteLocationGeneric } from 'vue-router'
import { hasSession } from '@/services/session.cookies'
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import forgot_psw from '../views/forgot_psw.vue';
import { legacySearchRedirect, searchPageProps } from './searchRoute';


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
  // Chemins portés par les notifications et emails de l'API : ces liens
  // restent valables dans les emails déjà envoyés, d'où des redirections.
  {
    path: '/conversations/:id',
    redirect: (to: RouteLocationGeneric) => `/adherents/messages/${to.params.id}`
  },
  {
    path: '/account/settings',
    redirect: '/adherents/settings'
  },
  {
    path: '/account/purchases/:id',
    redirect: (to: RouteLocationGeneric) => ({
      path: '/adherents/payments',
      query: { role: 'buyer', payment: to.params.id }
    })
  },
  {
    path: '/account/sales/:id',
    redirect: (to: RouteLocationGeneric) => ({
      path: '/adherents/payments',
      query: { role: 'seller', payment: to.params.id }
    })
  },
  {
    path: '/profile',
    redirect: '/adherents/profile/me'
  },
  {
    path: '/verification',
    redirect: { path: '/adherents/settings', query: { section: 'compte' } }
  },
  {
    path: '/reset-password/:token',
    name: 'reset_password',
    component: () => import('@/views/ResetPassword.vue'),
    meta: { title: 'Nouveau mot de passe' }
  },
  {
    path: '/verify-email/:token',
    name: 'verify_email',
    component: () => import('@/views/VerifyEmail.vue'),
    meta: { title: 'Vérification de l\'email' }
  },
  {
    path: '/products/:id',
    name: 'product',
    component: () => import('@/views/ProductView.vue'),
    meta: { title: 'Annonce' }
  },
  // Pages catalogue publiques, listées dans le sitemap de l'API.
  {
    path: '/groups/:id',
    name: 'group',
    component: () => import('@/views/catalog/GroupView.vue'),
    meta: { title: 'Groupe' }
  },
  {
    path: '/albums/:id',
    name: 'album',
    component: () => import('@/views/catalog/AlbumView.vue'),
    meta: { title: 'Album' }
  },
  {
    path: '/adherents/groups',
    name: 'followed_groups',
    component: () => import('@p_v/followed_groups.vue'),
    meta: { requiresAuth: true, title: 'Mes groupes suivis' }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Accueil' }
  },
  { path: '/login',
    name: 'login',
    component: Login,
    meta: { title: 'Connexion' }
  },
  {
    path: '/auth/callback',
    name: 'auth_callback',
    component: () => import('@/views/AuthCallback.vue'),
    meta: { title: 'Connexion…' },
  },
  { path: '/register',
    name: 'register',
    component: Register,
    meta: { title: 'Inscription' }
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
    component: () => import('@p_v/dashboard.vue'),
    meta: { requiresAuth: true, title: 'Accueil' }
  },
  {
    path: '/adherents/admin',
    name: 'admin',
    component: () => import('@/views/admin/admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Administration' }
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
    component: () => import('@p_v/dashboard.vue'),
    meta: { requiresAuth: true, title: 'Accueil' }
  },
  {
    path: '/adherents/collection',
    name: 'collection',
    component: () => import('@p_v/collection.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/adherents/saved-searches',
    name: 'saved_searches',
    component: () => import('@p_v/savedSearches.vue'),
    meta: { requiresAuth: true, title: 'Recherches sauvegardées' }
  },
  {
    path: '/adherents/profile/:id',
    name: 'profile',
    component: () => import('@p_v/profile.vue'),
    meta: { requiresAuth: true, title: 'Profil' }
  },
  {
    path: '/adherents/settings',
    name: 'settings',
    component: () => import('@p_v/settings.vue'),
    meta: { requiresAuth: true, title: 'Paramètres' }
  },
  {
    path: '/adherents/reports',
    name: 'my_reports',
    component: () => import('@p_v/MyReports.vue'),
    meta: { requiresAuth: true, title: 'Mes signalements' }
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
    path: '/search',
    name: 'searchList',
    component: () => import('../views/adherents/searchList.vue'),
    meta: { title: 'Recherche' },
    props: searchPageProps
  },
  // Ancien format `/search-<texte>-<événement>`, encore présent dans des
  // favoris et des historiques de navigation.
  {
    path: '/search-:combined?',
    redirect: legacySearchRedirect
  },
  {
    path: '/adherents/messages',
    name: 'messages',
    component: () => import('@/views/messaging/MessagesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Messages'
    }
  },
  {
    // Même vue, conversation pré-sélectionnée.
    path: '/adherents/messages/:id',
    name: 'conversation',
    component: () => import('@/views/messaging/MessagesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Messages'
    }
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
  },
  // Toujours en dernier : toute URL inconnue affiche la page 404.
  {
    path: '/:pathMatch(.*)*',
    name: 'not_found',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: 'Page introuvable' }
  }
];



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
  scrollBehavior(to, from, savedPosition) {
    // Précédent / suivant : on retrouve la position quittée.
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // Même page, seule la query change (onglet admin, filtre…) : on ne bouge pas,
    // sinon chaque frappe dans un champ synchronisé avec l'URL remonterait en haut.
    if (to.path === from.path) return false
    // Nouvelle page : en haut, comme une navigation classique.
    return { top: 0 }
  }
})

/**
 * Pages réservées aux visiteurs non connectés. Tant qu'une session peut être
 * rétablie, on renvoie l'utilisateur vers son tableau de bord plutôt que de lui
 * réafficher l'accueil ou l'écran de connexion.
 */
const GUEST_ONLY_ROUTES = new Set(['home', 'login', 'register'])

/**
 * Rôle lu auprès de l'API, jamais déduit côté client — via le store, qui ne
 * charge le profil qu'une fois par session. Import différé : le store importe
 * le service utilisateur, qui importe des modules qui importent ce routeur.
 */
async function isAdmin(): Promise<boolean> {
  try {
    const { useUserStore } = await import('@/store/user.store')
    const userStore = useUserStore()
    await userStore.fetchProfile()
    return userStore.isAdmin
  } catch {
    return false
  }
}

/**
 * Ces gardes évitent d'afficher une page cassée ; la seule vraie barrière
 * reste le contrôle d'accès de l'API.
 */
router.beforeEach(async (to) => {
  const loggedIn = hasSession()

  if (loggedIn && typeof to.name === 'string' && GUEST_ONLY_ROUTES.has(to.name)) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !(await isAdmin())) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = typeof title === 'string' ? `${title} · MyKpopTrade` : 'MyKpopTrade'
})



export default router

