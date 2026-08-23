// services/user.service.ts
import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import Cookies from "js-cookie";
import type {
    IUser,
    UserResponse
} from "@/types/user.types";
import router from "@/router";
import { API_URL } from '@/config/api';

const getSessionToken = (): string | undefined => Cookies.get('sessionToken');
const getIdUser = (): string | undefined => Cookies.get('id_user');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
export type ShippingMethod = 'national' | 'worldwide' | 'localPickup';

export interface ShippingAddressPayload {
  recipientName: string;
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  country?: string;
  phone?: string;
}

export interface InitPayPalPayload {
  productId: string | number;
  shippingMethod: ShippingMethod;
  shippingAddress?: ShippingAddressPayload;
}

interface PaymentDetails {
  id: string;
  paypalOrderId: string;
  amount: number;
  productAmount?: number;
  shippingAmount?: number;
  shippingMethod?: ShippingMethod;
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

/** Raison pour laquelle un vendeur ne peut pas encore encaisser via PayPal. */
export type PayPalBlockReason =
  | 'NOT_ONBOARDED'
  | 'STATUS_UNKNOWN'
  | 'EMAIL_UNCONFIRMED'
  | 'PAYMENTS_NOT_RECEIVABLE'
  | 'CONSENT_MISSING';

export interface PayPalAccountStatus {
  success: boolean;
  /** `true` uniquement si le vendeur peut réellement recevoir des paiements. */
  connected: boolean;
  merchantId: string | null;
  email: string | null;
  legalName: string | null;
  paymentsReceivable: boolean;
  primaryEmailConfirmed: boolean;
  consentGranted: boolean;
  scopes: string[];
  checkedAt: string | null;
  blockReason: PayPalBlockReason | null;
  /** Message prêt à afficher, fourni par le back. */
  blockMessage: string | null;
}

type AuthToken = string | null;


class paymentService {
    private paymentsApiClient: AxiosInstance;
    private API_BASE_URL: string = `${API_URL}/api`;

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
      try {
        const response: AxiosResponse<PaypalSatus> = await this.paymentsApiClient.get('/' + payment_id);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        console.error("Erreur lors de la vérification du paiement :", axiosError.response?.data);
        throw error;
      }
    }

  async initPayPal(payload: InitPayPalPayload): Promise<PaypalConfig> {
    try {
      const response: AxiosResponse<PaypalConfig> = await this.paymentsApiClient.post('/paypal/create', payload);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Erreur lors de l'initialisation PayPal :", axiosError.response?.data);
      throw error;
    }
  }

  async capturePayPal(payload: { paymentId?: string; paypalOrderId?: string }) {
    const response = await this.paymentsApiClient.post('/paypal/capture', {
      orderId: payload.paypalOrderId || payload.paymentId
    });
    return response.data;
  }

  async cancelPayPal(orderId: string) {
    const response = await this.paymentsApiClient.post('/paypal/cancel', { orderId });
    return response.data;
  }

  async confirmPayPal(params: { token?: string; PayerID?: string; paymentId?: string }) {
    const response = await this.paymentsApiClient.get('/paypal/confirm', { params });
    return response.data;
  }

  /** Génère le lien d'inscription PayPal (Partner Referrals) du vendeur. */
  async getPayPalOnboardingLink(): Promise<{ success: boolean; actionUrl: string; message?: string }> {
    const response = await this.paymentsApiClient.post('/paypal/onboarding-link');
    return response.data;
  }

  /**
   * Statut d'onboarding PayPal du vendeur.
   * `refresh` force MyKpopTrade à réinterroger PayPal — à utiliser quand le
   * vendeur vient de corriger son compte (email confirmé, restriction levée).
   */
  async getPayPalAccountStatus(refresh = false): Promise<PayPalAccountStatus> {
    const response = await this.paymentsApiClient.get('/paypal/account-status', {
      params: refresh ? { refresh: 'true' } : undefined
    });
    return response.data;
  }

  async disconnectPayPal() {
    const response = await this.paymentsApiClient.post('/paypal/disconnect');
    return response.data;
  }

  async refundPayment(paymentId: string, payload: { reason?: string; amount?: number; password?: string }) {
    const response = await this.paymentsApiClient.post(`/${paymentId}/refund`, payload);
    return response.data;
  }

  // ─── Stripe Connect ─────────────────────────────────────────────────────

  async getStripeOnboardingLink(): Promise<{ success: boolean; url: string }> {
    const response = await this.paymentsApiClient.post('/stripe/onboarding-link');
    return response.data;
  }

  async getStripeAccountStatus(): Promise<{
    success: boolean;
    onboarded: boolean;
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
    accountId?: string;
  }> {
    const response = await this.paymentsApiClient.get('/stripe/account-status');
    return response.data;
  }

  async initStripeCheckout(payload: InitPayPalPayload): Promise<{
    success: boolean;
    payment: {
      id: string;
      stripeSessionId: string;
      checkoutUrl: string;
      amount: number;
      productAmount?: number;
      shippingAmount?: number;
      shippingMethod?: ShippingMethod;
      currency: string;
    };
    message: string;
  }> {
    const response = await this.paymentsApiClient.post('/stripe/checkout', payload);
    return response.data;
  }

  async refundStripePayment(paymentId: string, payload: { reason?: string; amount?: number; password?: string }) {
    const response = await this.paymentsApiClient.post(`/stripe/${paymentId}/refund`, payload);
    return response.data;
  }

  async createShipment(paymentId: string, payload: { carrier: string; trackingNumber: string; estimatedDelivery?: string }) {
    const response = await this.paymentsApiClient.post(`/${paymentId}/shipment`, payload);
    return response.data;
  }

  async getShipment(paymentId: string) {
    const response = await this.paymentsApiClient.get(`/${paymentId}/shipment`);
    return response.data;
  }

  async markShipmentDelivered(paymentId: string) {
    const response = await this.paymentsApiClient.post(`/${paymentId}/shipment/delivered`);
    return response.data;
  }

  async exportPaymentData() {
    const response = await this.paymentsApiClient.get('/export');
    return response.data;
  }

  async anonymizeMyPaymentData(payload: { password: string }) {
    const response = await this.paymentsApiClient.post('/gdpr/anonymize', payload);
    return response.data;
  }

  async getMyPayments(params: { role?: 'buyer' | 'seller' | 'all'; status?: string; page?: number; limit?: number } = {}) {
    const response = await this.paymentsApiClient.get('/my', { params });
    return response.data;
  }

};

export default new paymentService();
