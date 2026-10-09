import Cookies from 'js-cookie';

/**
 * Écriture et effacement des cookies de session, en un seul endroit.
 *
 * Le refresh token (7 jours) n'est plus géré ici : l'API le pose dans un cookie
 * HttpOnly que JavaScript ne peut pas lire, pour qu'une XSS ne puisse pas
 * l'exfiltrer. Le front ne garde que le token d'accès (15 minutes) et l'id
 * utilisateur, qui sert aussi d'indice « une session existe ».
 */

/** Durée de vie du cookie, alignée sur JWT_EXPIRE côté API (15 minutes). */
const ACCESS_TOKEN_DAYS = 15 / 1440;

/** Durée de vie d'une session, alignée sur celle du refresh token (7 jours). */
const SESSION_DAYS = 7;

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

/** Enregistre les cookies de session après une connexion ou un renouvellement. */
export function setSessionCookies(session: { accessToken: string; userId?: string }): void {
  Cookies.set('sessionToken', session.accessToken, cookieOptions(ACCESS_TOKEN_DAYS));

  if (session.userId) {
    Cookies.set('id_user', session.userId, cookieOptions(SESSION_DAYS));
  }
}

/**
 * Une session peut-elle être rétablie ? Le refresh token étant illisible, on
 * s'appuie sur l'id utilisateur posé à la connexion pour la même durée. Ce
 * n'est qu'un indice : l'API reste seule juge au renouvellement.
 */
export function hasSession(): boolean {
  return Boolean(Cookies.get('id_user'));
}

/** Supprime tous les cookies de session lisibles par le front. */
export function clearSessionCookies(): void {
  Cookies.remove('sessionToken');
  Cookies.remove('id_user');
  // Ancien stockage du refresh token, avant son passage en cookie HttpOnly.
  Cookies.remove('refreshToken');
}
