import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import Cookies from "js-cookie";
import router from "@/router";
import { API_URL } from '@/config/api';

interface ApiError {
  message: string;
  status?: number;
}

export interface CartItem {
  product: {
    _id: string;
    title: string;
    images: string[];
    price: number;
    currency: string;
    isAvailable: boolean;
    isSold: boolean;
    seller: string;
  };
  addedAt: string;
  priceSnapshot: number;
  currencySnapshot: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  updatedAt: string;
}

export interface CartCheckoutPayment {
  sellerId: string;
  sellerUsername: string;
  paymentId: string;
  approvalUrl: string;
  amount: number;
  currency: string;
  productIds: string[];
}

class CartService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_URL}/api/cart`,
      headers: { 'Content-Type': 'application/json' }
    });
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.apiClient.interceptors.request.use((config) => {
      const token = Cookies.get('sessionToken') || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
        return Promise.reject(error);
      }
    );
  }

  async getCart(): Promise<Cart> {
    const response = await this.apiClient.get('/');
    return response.data.cart;
  }

  async addItem(productId: string): Promise<Cart> {
    const response = await this.apiClient.post('/items', { productId });
    return response.data.cart;
  }

  async removeItem(productId: string): Promise<Cart> {
    const response = await this.apiClient.delete(`/items/${productId}`);
    return response.data.cart;
  }

  async clearCart(): Promise<void> {
    await this.apiClient.delete('/');
  }

  async validateCart(): Promise<{ valid: boolean; issues: string[] }> {
    const response = await this.apiClient.post('/validate');
    return response.data;
  }

  async checkout(payload: {
    shippingMethod: 'national' | 'worldwide' | 'localPickup';
    shippingAddress?: {
      recipientName: string;
      streetLine1: string;
      streetLine2?: string;
      postalCode: string;
      city: string;
      country?: string;
      phone?: string;
    };
  }): Promise<CartCheckoutPayment[]> {
    const response = await this.apiClient.post('/checkout', payload);
    return response.data.payments;
  }

  async finalizeCheckout(): Promise<void> {
    await this.apiClient.post('/finalize');
  }
}

export default new CartService();
