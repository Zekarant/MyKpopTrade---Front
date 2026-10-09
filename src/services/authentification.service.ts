import { type AxiosInstance, AxiosError, type AxiosResponse } from "axios";
import Cookies from "js-cookie";
import router from "@/router";
import { API_URL } from '@/config/api';
import { setSessionCookies, clearSessionCookies, hasSession } from '@/services/session.cookies';
import { createApiClient, refreshAccessToken } from '@/services/http';
import { apiErrorMessage } from '@/services/apiError';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

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

class authentificationService {
  private authApiClient: AxiosInstance;
  private API_BASE_URL: string = `${API_URL}/api`;

  constructor() {
    // Les routes d'authentification (/login, /refresh-token, /logout, /2fa/)
    // sont exclues du renouvellement automatique côté `http.ts` : un 401 y
    // signifie « identifiants refusés », pas « session expirée ».
    // `withCredentials` : l'API y pose et y lit le refresh token, dans un
    // cookie HttpOnly qu'un appel cross-origin n'enverrait pas sinon.
    this.authApiClient = createApiClient({
      baseURL: `${this.API_BASE_URL}/auth`,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/login", {
        identifier,
        password,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }

      // Second facteur requis : pas de session ouverte à ce stade.
      if (response.data.requiresTwoFactor) {
        return { requiresTwoFactor: true, twoFactorToken: response.data.twoFactorToken };
      }

      setSessionCookies({
        accessToken: response.data.accessToken,
        userId: response.data.user.id
      });
      sessionStorage.removeItem("favorites");

      return { requiresTwoFactor: false };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data.message || "Erreur lors de la connexion");
    }
  }

  /**
   * Création de compte. Aucune session n'est ouverte : l'API envoie un email de
   * vérification et rend un message à afficher tel quel.
   * Une erreur réseau (sans `response`) donne le message générique au lieu de
   * planter sur `error.response.data`.
   */
  async register(payload: RegisterPayload): Promise<string> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/register", payload);
      return response.data?.message || "Inscription réussie !";
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Une erreur est survenue. Veuillez réessayer."));
    }
  }

  /**
   * Demande d'un lien de réinitialisation. L'API répond le même message que
   * l'email existe ou non, pour ne pas révéler les comptes inscrits.
   */
  async forgotPassword(email: string): Promise<string> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/forgot-password", { email });
      return response.data?.message || "Si un compte existe pour cet email, un lien vient d'être envoyé.";
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Une erreur est survenue."));
    }
  }

  /**
   * Fin de connexion Google/Discord : échange le code à usage unique contre la
   * session, pour que les jetons ne transitent jamais par une URL.
   */
  async exchangeOAuthCode(code: string): Promise<void> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/oauth/exchange", { code });

      setSessionCookies({
        accessToken: response.data.accessToken,
        userId: response.data.user.id
      });
      sessionStorage.removeItem("favorites");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.message || "Connexion impossible.");
    }
  }

  /**
   * Deuxième étape de connexion : échange le jeton de défi et un code (TOTP ou
   * code de secours) contre une session complète.
   */
  async verifyTwoFactor(twoFactorToken: string, code: string): Promise<void> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/2fa/verify", {
        twoFactorToken,
        code,
      });

      setSessionCookies({
        accessToken: response.data.accessToken,
        userId: response.data.user.id
      });
      sessionStorage.removeItem("favorites");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data.message || "Impossible de vérifier le code."
      );
    }
  }

  async logout(): Promise<void> {
    try {
      // Le refresh token part dans son cookie HttpOnly, que l'API efface.
      await this.authApiClient.post("/logout");
    } catch {
      // Ignore errors on logout request
    } finally {
      this.clearCookies();
      // Profil, panier, notifications et conversations appartiennent au compte
      // qui se déconnecte. Import différé : les stores importent des services
      // qui importent celui-ci.
      const { resetSessionStores } = await import('@/store/resetSessionStores');
      resetSessionStores();
      router.push("/login");
    }
  }
  async verifSession(): Promise<void> {
    // Sans session (durée de vie 7 jours), rien ne peut être rétabli : c'est la
    // seule trace qui survit à la fermeture de l'onglet et à l'expiration du
    // token d'accès.
    if (!hasSession()) {
      await this.logout();
      throw new Error("No session token");
    }

    // Le token d'accès (15 min) est encore là : la session est valide, inutile
    // de solliciter l'API. Sans ce court-circuit, un simple retour sur le site
    // après expiration du token d'accès déconnectait l'utilisateur alors que le
    // refresh token restait valable.
    const sessionToken = Cookies.get("sessionToken");
    if (sessionToken) {
      return;
    }

    // Renouvellement mutualisé avec les intercepteurs : si une requête a déjà
    // lancé un rafraîchissement, on attend le même appel réseau.
    const accessToken = await refreshAccessToken();

    if (!accessToken) {
      await this.logout();
      throw new Error("Session refresh failed");
    }
  }
  clearCookies(): void {
    clearSessionCookies();
  }
}

export default new authentificationService();
