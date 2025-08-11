// services/user.service.ts
import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";

import Cookies from "js-cookie";
import authentificationService  from '@/services/authentification.service';
import type {
    IUser,
    UserResponse
} from "@/types/user.types";
import router from "@/router";

const getSessionToken = (): string | undefined => Cookies.get('sessionToken');
const getIdUser = (): string | undefined => Cookies.get('id_user');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
type AuthToken = string | null;



class userService {
    private userApiClient: AxiosInstance;
    private API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

    constructor() {
    
        this.userApiClient = axios.create({
        baseURL: `${this.API_BASE_URL}/profiles`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        // Configuration des intercepteurs pour les deux clients
        this.setupInterceptors(this.userApiClient);
    }
    // Interceptor setup authentificationServicetion
    private setupInterceptors(client: AxiosInstance) {
        client.interceptors.request.use(
            (config) => {
            const token = this.getAuthToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
            },
            (error: any) => Promise.reject(error)
        );

        client.interceptors.response.use(
            (response) => response,
            (error: any) => {
            if (error.response?.status === 401) {
                this.handleUnauthorized();
            }
            return Promise.reject(error);
            }
        );
    }
    private handleUnauthorized(): void {
        localStorage.removeItem('token');
        router.push('/login');
    }
    private getAuthToken(): AuthToken {
        // Utilise js-cookie pour récupérer le sessionToken
        const sessionToken = Cookies.get('sessionToken');
        if (sessionToken) {
        return sessionToken;
        }

        // Fallback : récupère le token du localStorage
        return localStorage.getItem('token');
    }
  async getUserByName(name: string): Promise<UserResponse> {
    try {        
      const response: AxiosResponse<UserResponse> = await this.userApiClient.get(
        `/user/${name}`
      );

      if (
        response.data.message === "Token invalide" ||
        (response as any).data.code === "TOKEN_EXPIRED" ||
        response.status === 401
      ) {
        authentificationService.verifSession();
      }

      return response.data;
    } catch (error: any) {
      if (
        error?.response?.data?.message === "Token invalide" ||
        error?.response?.data?.code === "TOKEN_EXPIRED" ||
        error?.response?.status === 401
      ) {
        authentificationService.verifSession();
      }
      console.error("Erreur lors de la recherche :", error);
      throw error;
    }
  }

  async getMyInformation(): Promise<UserResponse> {
    try {
      const response: AxiosResponse<UserResponse> = await this.userApiClient.get(
        `/me`
      );

      if (
        response.data.message === "Token invalide" ||
        (response as any).data.code === "TOKEN_EXPIRED" ||
        response.status === 401
      ) {
        authentificationService.verifSession();
      }

      return response.data;
    } catch (error: any) {
      if (
        error?.response?.data?.message === "Token invalide" ||
        error?.response?.data?.code === "TOKEN_EXPIRED" ||
        error?.response?.status === 401
      ) {
        authentificationService.verifSession();
      }
      console.error("Erreur lors de la récupération :", error);
      throw error;
    }
  }
};
export default new userService();