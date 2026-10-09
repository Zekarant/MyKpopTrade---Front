import type { RouteMeta, RouteRecordNameGeneric } from 'vue-router';

/**
 * Affichage de la barre de navigation, rendue une seule fois par App.vue au
 * lieu d'être incluse (et remontée, avec trois appels API) dans chaque vue :
 * - `'always'` : pages de l'espace membre, et pages publiques qui l'affichaient déjà ;
 * - `'auth'`   : pages légales, FAQ, bêta — barre seulement si une session existe,
 *                sinon la page affiche son propre lien « Retour à l'accueil » ;
 * - `false`    : accueil, connexion, inscription, retours OAuth et paiement, 404.
 */
export type NavbarMode = 'always' | 'auth' | false;

/**
 * Mode par nom de route. Tenu ici plutôt que dans chaque `meta` pour garder la
 * règle lisible d'un coup d'œil ; `meta.navbar` reste prioritaire si une route
 * le déclare.
 */
export const NAVBAR_BY_ROUTE: Record<string, NavbarMode> = {
  dashboard: 'always',
  admin: 'always',
  adherents: 'always',
  collection: 'always',
  saved_searches: 'always',
  profile: 'always',
  settings: 'always',
  my_reports: 'always',
  payments: 'always',
  searchList: 'always',
  messages: 'always',
  conversation: 'always',
  add_post: 'always',
  modify_post: 'always',
  add_review: 'always',
  contact: 'always',
  disputes: 'always',
  dispute_detail: 'always',
  cart: 'always',
  product: 'always',
  group: 'always',
  album: 'always',
  followed_groups: 'always',
  cgu: 'auth',
  privacy: 'auth',
  legal: 'auth',
  cookies: 'auth',
  beta: 'auth',
  faq: 'auth'
};

export function navbarModeFor(route: { name?: RouteRecordNameGeneric | null; meta?: RouteMeta }): NavbarMode {
  const declared = route.meta?.navbar;
  if (declared === 'always' || declared === 'auth' || declared === false) return declared;
  return typeof route.name === 'string' ? NAVBAR_BY_ROUTE[route.name] ?? false : false;
}

export function shouldShowNavbar(mode: NavbarMode, loggedIn: boolean): boolean {
  if (mode === 'always') return true;
  if (mode === 'auth') return loggedIn;
  return false;
}
