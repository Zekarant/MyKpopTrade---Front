import axios, { type AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

export interface AddressResult {
  label: string;
  streetLine1: string;
  postalCode: string;
  city: string;
  country: 'FR';
  context: string;
  score: number;
}

export interface ShippingAddressInput {
  recipientName: string;
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  country: string;
  phone?: string;
}

class AddressService {
  private client: AxiosInstance;

  constructor() {
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/addresses`;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });
    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('sessionToken');
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async lookup(params: { q?: string; postalCode?: string; city?: string; limit?: number }): Promise<AddressResult[]> {
    if (!params.q && !params.postalCode) return [];
    const response = await this.client.get<{ success: boolean; results: AddressResult[] }>('/lookup', { params });
    return response.data.results ?? [];
  }
}

export default new AddressService();
