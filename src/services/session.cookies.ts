import Cookies from 'js-cookie';

/**
 * Écriture et effacement des cookies de session, en un seul endroit.
 *
 * Trois appelants les posaient auparavant à la main (connexion, rafraîchissement
 * de session, callback OAuth), avec deux divergences :
 * - aucun attribut `secure` / `sameSite` n'était défini ;
 * - le rafraîchissement stockait `sessionToken` pour 1 jour alors que le JWT
 *   expire au bout de 15 minutes, laissant l'utilisateur « à moitié connecté »
 *   (cookie présent, token refusé par l'API).
 */

/** Durée de vie du cookie, alignée sur JWT_EXPIRE côté API (15 minutes). */
const ACCESS_TOKEN_DAYS = 15 / 1440;

/** Durée de vie du refresh token, alignée sur JWT_REFRESH_EXPIRE (7 jours). */
const REFRESH_TOKEN_DAYS = 7;

/**
 * `Lax` et non `Strict` : les retours de redirection OAuth (Google, Discord)
 * sont des navigations de premier niveau depuis un autre domaine, que `Strict`
 * bloquerait. `secure` est conditionné au protocole pour rester utilisable en
 * développement sur http://localhost.
 */
function cookieOptions(days: number): Cookies.CookieAttributes {
  return {
    expires: days,
    sameSite: 'Lax',
    secure: window.location.protocol === 'https:'
  };
}

/** Enregistre les cookies de session après une connexion réussie. */
export function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken: string;
  userId?: string;
}): void {
  Cookies.set('sessionToken', tokens.accessToken, cookieOptions(ACCESS_TOKEN_DAYS));
  Cookies.set('refreshToken', tokens.refreshToken, cookieOptions(REFRESH_TOKEN_DAYS));

  if (tokens.userId) {
    Cookies.set('id_user', tokens.userId, cookieOptions(REFRESH_TOKEN_DAYS));
  }
}

/** Supprime tous les cookies de session. */
export function clearSessionCookies(): void {
  Cookies.remove('sessionToken');
  Cookies.remove('refreshToken');
  Cookies.remove('id_user');
}
