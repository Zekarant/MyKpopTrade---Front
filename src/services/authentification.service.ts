import { setSessionCookies, clearSessionCookies, hasSession } from '@/services/session.cookies';
import { getAccessToken, refreshAccessToken } from '@/services/http';
import { apiClient } from '@/services/apiClient';
import { toApiError } from '@/services/apiError';
import { notifySessionEnded } from '@/services/sessionEvents';

/**
 * Résultat d'une tentative de connexion.
 *
 * Quand la double authentification est active, l'API ne délivre aucun jeton
 * d'accès : elle rend un jeton de défi à courte durée de vie, à échanger sur
 * /auth/2fa/verify contre une vraie session.
 */
export type LoginResult =
  | { requiresTwoFactor: false }
  | { requiresTwoFactor: true; twoFactorToken: string };

/**
 * Corps attendu par POST /api/auth/register (registerController côté API).
 * `privacyPolicy` et `dataProcessing` doivent valoir `true`, sinon l'API refuse ;
 * `marketing` reste un consentement facultatif et séparé (RGPD art. 7(4)).
 */
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  privacyPolicy: boolean;
  dataProcessing: boolean;
  marketing: boolean;
}

/** Réponse des routes qui ouvrent une session (connexion, OAuth, 2FA). */
interface SessionResponse {
  accessToken: string;
  user: { id: string };
}

/**
 * Connexion, inscription et fin de session.
 *
 * Les erreurs sont des `ApiError` dont le message est celui de l'API, sinon un
 * repli propre à l'action. La redirection après déconnexion n'est pas faite
 * ici : la fin de session est annoncée (sessionEvents.ts) et l'application y
 * réagit, ce qui évite à ce service d'importer le routeur.
 */
class AuthentificationService {
  // Les routes d'authentification (/login, /refresh-token, /logout, /2fa/)
  // sont exclues du renouvellement automatique côté `http.ts` : un 401 y
  // signifie « identifiants refusés », pas « session expirée ».
  // `withCredentials` : l'API y pose et y lit le refresh token, dans un
  // cookie HttpOnly qu'un appel cross-origin n'enverrait pas sinon.
  private client = apiClient('/api/auth', { withCredentials: true });

  /** Ouvre la session côté front ; les favoris en cache appartenaient au compte précédent. */
  private openSession(session: SessionResponse): void {
    setSessionCookies({ accessToken: session.accessToken, userId: session.user.id });
    sessionStorage.removeItem('favorites');
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    try {
      type LoginResponse = SessionResponse & { requiresTwoFactor?: boolean; twoFactorToken: string };
      const { data } = await this.client.post<LoginResponse>('/login', { identifier, password });

      // Second facteur requis : pas de session ouverte à ce stade.
      if (data.requiresTwoFactor) {
        return { requiresTwoFactor: true, twoFactorToken: data.twoFactorToken };
      }

      this.openSession(data);
      return { requiresTwoFactor: false };
    } catch (error) {
      throw toApiError(error, 'Erreur lors de la connexion');
    }
  }

  /**
   * Création de compte. Aucune session n'est ouverte : l'API envoie un email de
   * vérification et rend un message à afficher tel quel.
   */
  async register(payload: RegisterPayload): Promise<string> {
    try {
      const { data } = await this.client.post<{ message?: string }>('/register', payload);
      return data?.message || 'Inscription réussie !';
    } catch (error) {
      throw toApiError(error, 'Une erreur est survenue. Veuillez réessayer.');
    }
  }

  /**
   * Demande d'un lien de réinitialisation. L'API répond le même message que
   * l'email existe ou non, pour ne pas révéler les comptes inscrits.
   */
  async forgotPassword(email: string): Promise<string> {
    try {
      const { data } = await this.client.post<{ message?: string }>('/forgot-password', { email });
      return data?.message || "Si un compte existe pour cet email, un lien vient d'être envoyé.";
    } catch (error) {
      throw toApiError(error, 'Une erreur est survenue.');
    }
  }

  /**
   * Fin de connexion Google/Discord : échange le code à usage unique contre la
   * session, pour que les jetons ne transitent jamais par une URL.
   */
  async exchangeOAuthCode(code: string): Promise<void> {
    try {
      const { data } = await this.client.post<SessionResponse>('/oauth/exchange', { code });
      this.openSession(data);
    } catch (error) {
      throw toApiError(error, 'Connexion impossible.');
    }
  }

  /**
   * Deuxième étape de connexion : échange le jeton de défi et un code (TOTP ou
   * code de secours) contre une session complète.
   */
  async verifyTwoFactor(twoFactorToken: string, code: string): Promise<void> {
    try {
      const { data } = await this.client.post<SessionResponse>('/2fa/verify', { twoFactorToken, code });
      this.openSession(data);
    } catch (error) {
      throw toApiError(error, 'Impossible de vérifier le code.');
    }
  }

  async logout(): Promise<void> {
    try {
      // Le refresh token part dans son cookie HttpOnly, que l'API efface.
      await this.client.post('/logout');
    } catch {
      // Déconnexion locale quoi qu'il arrive : un refus de l'API ne doit pas garder l'utilisateur connecté.
    } finally {
      this.clearCookies();
      notifySessionEnded('logout');
    }
  }

  async verifSession(): Promise<void> {
    // Sans session (durée de vie 7 jours), rien ne peut être rétabli : c'est la
    // seule trace qui survit à la fermeture de l'onglet et à l'expiration du
    // token d'accès.
    if (!hasSession()) {
      await this.logout();
      throw new Error('No session token');
    }

    // Le token d'accès (15 min) est encore là : la session est valide, inutile
    // de solliciter l'API. Sans ce court-circuit, un simple retour sur le site
    // après expiration du token d'accès déconnectait l'utilisateur alors que le
    // refresh token restait valable.
    if (getAccessToken()) {
      return;
    }

    // Renouvellement mutualisé avec les intercepteurs : si une requête a déjà
    // lancé un rafraîchissement, on attend le même appel réseau.
    const accessToken = await refreshAccessToken();

    if (!accessToken) {
      await this.logout();
      throw new Error('Session refresh failed');
    }
  }

  clearCookies(): void {
    clearSessionCookies();
  }
}

export default new AuthentificationService();
