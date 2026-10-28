import { apiClient } from '@/services/apiClient';
import type { ShippingMethod } from '@/services/payment.service';

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
    /** Absent si le compte du vendeur a été supprimé. */
    sellerUsername?: string;
  };
  addedAt: string;
  priceSnapshot: number;
  currencySnapshot: string;
  /** Prix produit que PayPal facturera : négociation acceptée comprise, hors livraison. */
  buyerPrice?: number;
  /** Frais de port que PayPal ajoutera, par méthode ; `null` si le vendeur ne la propose pas. */
  shippingCosts?: Record<ShippingMethod, number | null> | null;
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
  /** Identifiant attendu par /payments/paypal/capture et /cancel (le `token` du retour PayPal). */
  paypalOrderId: string;
  approvalUrl: string;
  amount: number;
  currency: string;
  productIds: string[];
}

class CartService {
  private client = apiClient('/api/cart');

  async getCart(): Promise<Cart> {
    const response = await this.client.get('/');
    return response.data.cart;
  }

  async addItem(productId: string): Promise<Cart> {
    const response = await this.client.post('/items', { productId });
    return response.data.cart;
  }

  async removeItem(productId: string): Promise<Cart> {
    const response = await this.client.delete(`/items/${productId}`);
    return response.data.cart;
  }

  async clearCart(): Promise<void> {
    await this.client.delete('/');
  }

  async validateCart(): Promise<{ valid: boolean; issues: string[] }> {
    const response = await this.client.post('/validate');
    return response.data;
  }

  async checkout(payload: {
    shippingMethod: ShippingMethod;
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
    const response = await this.client.post('/checkout', payload);
    return response.data.payments;
  }

  async finalizeCheckout(): Promise<void> {
    await this.client.post('/finalize');
  }
}

export default new CartService();
