import axios, { type AxiosInstance, AxiosError, type AxiosResponse } from "axios";
import Cookies from "js-cookie";
import router from "@/router";

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

type AuthToken = string | null;

class authentificationService {
  private authApiClient: AxiosInstance;
  private API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  constructor() {
    this.authApiClient = axios.create({
      baseURL: `${this.API_BASE_URL}/auth`,
      headers: {
        "Content-Type": "application/json",
      }
    });

    this.setupInterceptors(this.authApiClient);
  }

  private setupInterceptors(client: AxiosInstance): void {
    client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private handleUnauthorized(): void {
    localStorage.removeItem("token");
    this.clearCookies();
    router.push("/login");
  }

  private getAuthToken(): AuthToken {
    const sessionToken = Cookies.get("sessionToken");
    if (sessionToken) {
      return sessionToken;
    }
    return localStorage.getItem("token");
  }

  async login(identifier: string, password: string): Promise<void> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/login", {
        identifier,
        password,
      });
      if (response.status === 200) {
        Cookies.set("sessionToken", response.data.accessToken, { expires: 15 / 1440 });
        Cookies.set("refreshToken", response.data.refreshToken, { expires: 1 });
        Cookies.set("id_user", response.data.user.id, { expires: 1 });
        sessionStorage.removeItem("favorites");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data.message || "Erreur lors de la connexion");
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = Cookies.get("refreshToken");
      await this.authApiClient.post("/logout", { refreshToken });
    } catch (_) {
      // Ignore errors on logout request
    } finally {
      this.clearCookies();
      router.push("/login");
    }
  }
  async verifSession(): Promise<void> {
    const sessionToken = Cookies.get("sessionToken");

    if (!sessionToken) {
      this.logout();
      return;
    }

    try {
      const refreshToken = Cookies.get("refreshToken");

      const response: AxiosResponse<RefreshTokenResponse> = await this.authApiClient.post(
        '/refresh-token',
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.status === 200) {
        Cookies.set("sessionToken", response.data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", response.data.refreshToken, { expires: 1 });
      } else {
        this.logout();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Erreur lors de la vérification de session :", axiosError.response?.data);
      this.logout();
    }
  }
  clearCookies(): void {
    Cookies.remove("sessionToken");
    Cookies.remove("refreshToken");
    Cookies.remove("id_user");
    document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }
}

export default new authentificationService();
