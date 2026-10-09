import axios, {
  type AxiosInstance,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/config/api';
import { setSessionCookies, clearSessionCookies, hasSession } from '@/services/session.cookies';

export { hasSession };

/**
 * Client HTTP partagé et renouvellement de session.
 *
 * Le token d'accès expire au bout de 15 minutes (JWT_EXPIRE côté API) alors que
 * le refresh token vit 7 jours (JWT_REFRESH_EXPIRE). Chaque service posait
 * auparavant ses propres intercepteurs, et neuf d'entre eux effaçaient la
 * session au premier 401 sans jamais tenter de la renouveler : passé un quart
 * d'heure, l'utilisateur était éjecté (« Utilisateur / Mon compte » dans la
 * barre de navigation) alors que son refresh token était encore valable.
 *
 * Le renouvellement se fait ici à deux moments :
 * - en amont, quand le cookie d'accès a expiré mais que le refresh token est
 *   toujours là — la requête part alors directement avec un token frais ;
 * - en réaction, si l'API répond quand même 401 (décalage d'horloge, token
 *   révoqué côté serveur) — la requête est rejouée une seule fois.
 *
 * Un seul appel réseau de renouvellement est en vol à la fois : les requêtes
 * concurrentes attendent la même promesse, sinon un chargement de page qui
 * déclenche dix requêtes déclencherait dix renouvellements.
 */

const REFRESH_ENDPOINT = `${API_URL}/api/auth/refresh-token`;

/**
 * Requêtes d'authentification : jamais de renouvellement ni de rejeu dessus.
 * Un 401 sur /login est une mauvaise saisie de mot de passe, pas une session
 * expirée, et rejouer /refresh-token bouclerait indéfiniment.
 */
const AUTH_PATHS = ['/login', '/register', '/refresh-token', '/logout', '/2fa/', '/oauth/'];

/**
 * Codes qu'un 401 de l'API porte quand c'est la session qui est en cause.
 * Un 401 avec un autre code est un refus métier (mot de passe actuel erroné,
 * par exemple) : le renouveler déconnecterait à tort ou rejouerait la saisie.
 */
const SESSION_ERROR_CODES = new Set(['TOKEN_EXPIRED', 'USER_NOT_FOUND']);

function isSessionError(error: { response?: { status?: number; data?: { code?: unknown } } }): boolean {
  if (error?.response?.status !== 401) return false;
  const code = error.response.data?.code;
  return typeof code !== 'string' || SESSION_ERROR_CODES.has(code);
}

let refreshInFlight: Promise<string | null> | null = null;

/** Token d'accès courant, sans renouvellement. */
export function getAccessToken(): string | null {
  return Cookies.get('sessionToken') ?? null;
}

/**
 * Renouvelle le token d'accès à partir du refresh token, que le navigateur
 * envoie dans son cookie HttpOnly (d'où `withCredentials`) et que l'API
 * remplace à chaque échange.
 * Rend `null` si aucune session ne peut être rétablie — l'appelant décide alors
 * quoi faire (rejeter l'erreur, rediriger...).
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  if (!hasSession()) {
    return Promise.resolve(null);
  }

  // `axios` nu volontairement : passer par un client instrumenté relancerait
  // ces mêmes intercepteurs sur la requête de renouvellement.
  refreshInFlight = axios
    .post<{ accessToken?: string }>(REFRESH_ENDPOINT, null, { withCredentials: true })
    .then(({ data }) => {
      if (!data?.accessToken) {
        return null;
      }
      setSessionCookies({ accessToken: data.accessToken });
      return data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/** Token utilisable, renouvelé si besoin. Pour les appels `axios` hors client instrumenté. */
export async function ensureAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) {
    return token;
  }
  return refreshAccessToken();
}

/**
 * Session définitivement perdue : on nettoie et on renvoie vers la connexion.
 *
 * La redirection n'a lieu que si une session existait réellement. Sans ce
 * garde-fou, un visiteur anonyme qui effleure un endpoint protégé (une page
 * publique qui demande ses favoris, par exemple) se retrouverait propulsé sur
 * /login — ce que ne faisaient pas les services qui ignoraient les 401.
 */
function handleSessionLost(hadSession: boolean): void {
  clearSessionCookies();

  if (!hadSession || window.location.pathname === '/login') {
    return;
  }

  // Import différé : le routeur charge des vues qui importent des services,
  // donc ce module. Un import statique créerait un cycle à l'initialisation.
  void import('@/router').then(({ default: router }) => {
    router.push('/login');
  });
}

function isAuthPath(url?: string): boolean {
  return Boolean(url) && AUTH_PATHS.some((path) => url!.includes(path));
}

/** Pose les intercepteurs d'authentification sur un client existant. */
export function installAuthInterceptors(client: AxiosInstance): AxiosInstance {
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    let token = getAccessToken();

    if (!token && !isAuthPath(config.url) && hasSession()) {
      token = await refreshAccessToken();
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config as
        | (InternalAxiosRequestConfig & { _authRetry?: boolean })
        | undefined;

      if (
        !isSessionError(error) ||
        !config ||
        config._authRetry ||
        isAuthPath(config.url)
      ) {
        return Promise.reject(error);
      }

      const hadSession = hasSession();
      const token = await refreshAccessToken();

      if (!token) {
        handleSessionLost(hadSession);
        return Promise.reject(error);
      }

      config._authRetry = true;
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return client.request(config);
    }
  );

  return client;
}

/** Crée un client axios déjà équipé du renouvellement de session. */
export function createApiClient(config: CreateAxiosDefaults = {}): AxiosInstance {
  return installAuthInterceptors(axios.create(config));
}
