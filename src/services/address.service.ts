import { apiClient } from '@/services/apiClient';

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
  private client = apiClient('/api/addresses');

  async lookup(params: { q?: string; postalCode?: string; city?: string; limit?: number }): Promise<AddressResult[]> {
    if (!params.q && !params.postalCode) return [];
    const response = await this.client.get<{ success: boolean; results: AddressResult[] }>('/lookup', { params });
    return response.data.results ?? [];
  }
}

export default new AddressService();
