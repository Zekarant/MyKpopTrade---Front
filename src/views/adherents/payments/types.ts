/** Paiement tel que renvoyé par GET /api/payments/my. */
export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
  createdAt: string;
  product: { _id: string; title?: string; images?: string[]; price?: number; currency?: string } | null;
  buyer: string | { _id: string };
  seller: string | { _id: string };
  productAmount?: number;
  shippingAmount?: number;
  totalRefunded?: number;
  refunds?: Refund[];
  shipment?: Shipment;
}

export interface Refund {
  refundId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'completed' | 'failed';
  initiatedAt: string;
  settledAt?: string;
}

export interface Shipment {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: 'shipped' | 'delivered';
  shippedAt: string;
  deliveredAt?: string;
  estimatedDeliveryAt?: string;
  autoConfirmedAt?: string;
  events?: ShipmentEvent[];
}

export interface ShipmentEvent {
  status: string;
  description?: string;
  location?: string;
  occurredAt: string;
  source: 'system' | 'seller' | 'buyer' | 'carrier';
}

export type PaymentRole = 'all' | 'buyer' | 'seller';

export interface ShipmentPayload {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

export interface RefundPayload {
  reason: string;
  password: string;
  /** Absent : le back rembourse tout le restant. */
  amount?: number;
}
