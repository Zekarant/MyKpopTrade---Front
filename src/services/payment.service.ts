import { apiClient } from '@/services/apiClient';

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

interface PaypalStatus {
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

class PaymentService {
  private client = apiClient('/api/payments');

  async checkPaymentStatus(paymentId: string): Promise<PaypalStatus> {
    const { data } = await this.client.get<PaypalStatus>(`/${paymentId}`);
    return data;
  }

  async initPayPal(payload: InitPayPalPayload): Promise<PaypalConfig> {
    const { data } = await this.client.post<PaypalConfig>('/paypal/create', payload);
    return data;
  }

  async capturePayPal(payload: { paymentId?: string; paypalOrderId?: string }) {
    const response = await this.client.post('/paypal/capture', {
      orderId: payload.paypalOrderId || payload.paymentId
    });
    return response.data;
  }

  async cancelPayPal(orderId: string) {
    const response = await this.client.post('/paypal/cancel', { orderId });
    return response.data;
  }

  async confirmPayPal(params: { token?: string; PayerID?: string; paymentId?: string }) {
    const response = await this.client.get('/paypal/confirm', { params });
    return response.data;
  }

  /** Génère le lien d'inscription PayPal (Partner Referrals) du vendeur. */
  async getPayPalOnboardingLink(): Promise<{ success: boolean; actionUrl: string; message?: string }> {
    const response = await this.client.post('/paypal/onboarding-link');
    return response.data;
  }

  /**
   * Statut d'onboarding PayPal du vendeur.
   * `refresh` force MyKpopTrade à réinterroger PayPal — à utiliser quand le
   * vendeur vient de corriger son compte (email confirmé, restriction levée).
   */
  async getPayPalAccountStatus(refresh = false): Promise<PayPalAccountStatus> {
    const response = await this.client.get('/paypal/account-status', {
      params: refresh ? { refresh: 'true' } : undefined
    });
    return response.data;
  }

  async disconnectPayPal() {
    const response = await this.client.post('/paypal/disconnect');
    return response.data;
  }

  async refundPayment(paymentId: string, payload: { reason?: string; amount?: number; password?: string }) {
    const response = await this.client.post(`/${paymentId}/refund`, payload);
    return response.data;
  }

  async createShipment(paymentId: string, payload: { carrier: string; trackingNumber: string; estimatedDelivery?: string }) {
    const response = await this.client.post(`/${paymentId}/shipment`, payload);
    return response.data;
  }

  async getShipment(paymentId: string) {
    const response = await this.client.get(`/${paymentId}/shipment`);
    return response.data;
  }

  async markShipmentDelivered(paymentId: string) {
    const response = await this.client.post(`/${paymentId}/shipment/delivered`);
    return response.data;
  }

  async exportPaymentData() {
    const response = await this.client.get('/export');
    return response.data;
  }

  async anonymizeMyPaymentData(payload: { password: string }) {
    const response = await this.client.post('/gdpr/anonymize', payload);
    return response.data;
  }

  async getMyPayments(params: { role?: 'buyer' | 'seller' | 'all'; status?: string; page?: number; limit?: number } = {}) {
    const response = await this.client.get('/my', { params });
    return response.data;
  }
}

export default new PaymentService();
