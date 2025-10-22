// services/user.service.ts
import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import Cookies from "js-cookie";
import type {
    IUser,
    UserResponse
} from "@/types/user.types";
import router from "@/router";
import authentificationService from "./authentification.service";

const getSessionToken = (): string | undefined => Cookies.get('sessionToken');
const getIdUser = (): string | undefined => Cookies.get('id_user');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
interface PaymentDetails {
  id: string;
  paypalOrderId: string;
  amount: number;
  currency: string;
  approvalUrl: string;
}

interface PaypalConfig {
  success: boolean;
  payment: PaymentDetails;
  message: string;
}

interface PaypalSatus {
  success: boolean;
  status: string;
  payment: PaymentDetails;

}
type AuthToken = string | null;


class paymentService {
    private paymentsApiClient: AxiosInstance;
    private API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

    constructor() {
    
        this.paymentsApiClient = axios.create({
        baseURL: `${this.API_BASE_URL}/payments`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        // Configuration des intercepteurs pour les deux clients
        this.setupInterceptors(this.paymentsApiClient);
    }
    private setupInterceptors(client: AxiosInstance): void {
        // Intercepteur pour ajouter le token JWT ou le cookie PHPSESSID
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

        // Intercepteur pour gérer les erreurs
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

    async checkPaymentStatus(payment_id: string): Promise<PaypalSatus> {
      const sessionToken = Cookies.get("sessionToken");
          try {

            const response: AxiosResponse<PaypalSatus> = await this.paymentsApiClient.post(
              '/'+payment_id,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionToken}`,
                },
              }
            );

            if (response.status === 200) {
              return response.data;

            } else {
              await authentificationService.verifSession();
              return this.checkPaymentStatus(payment_id);
            }
          } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            console.error("Erreur lors de la vérification de session :", axiosError.response?.data);
            throw error;

          }
    }

  async initPayPal(idProduct: string | number | undefined): Promise<PaypalConfig> {
    const sessionToken = Cookies.get("sessionToken");

    try {

      const response: AxiosResponse<PaypalConfig> = await this.paymentsApiClient.post(
        '/paypal/create',
        { 
          productId: idProduct
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.status === 200) {
        return response.data;

      } else {
        await authentificationService.verifSession();
        return this.initPayPal(idProduct);

      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Erreur lors de la vérification de session :", axiosError.response?.data);
      throw error;

    }
  }

};

export default new paymentService();