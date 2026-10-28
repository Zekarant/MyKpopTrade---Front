import type { CartItem } from '@/services/cart.service';
import type { ShippingMethod } from '@/services/payment.service';
import { sumAmounts } from '@/utils/money';

type PricedCartItem = Pick<CartItem, 'priceSnapshot' | 'buyerPrice'> & { product: Pick<CartItem['product'], 'price'> };

/**
 * Prix produit que PayPal facturera (hors livraison). Le snapshot sert de
 * repli si le back ne renvoie pas encore `buyerPrice`.
 */
export function cartItemPrice(item: PricedCartItem): number {
  return item.buyerPrice ?? item.priceSnapshot;
}

/** Vrai si l'acheteur paie un prix négocié plutôt que le prix catalogue. */
export function isNegotiatedPrice(item: PricedCartItem): boolean {
  return item.buyerPrice !== undefined && item.buyerPrice !== item.product.price;
}

export function sumCartItems(items: PricedCartItem[]): number {
  return sumAmounts(items.map(cartItemPrice));
}

export interface SellerGroup<T> {
  sellerId: string;
  items: T[];
}

/** Articles regroupés par vendeur, dans l'ordre du panier. */
export function groupCartItemsBySeller<T extends { product: Pick<CartItem['product'], 'seller'> }>(
  items: T[]
): SellerGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const sellerId = item.product.seller || 'unknown';
    const group = groups.get(sellerId);
    if (group) group.push(item);
    else groups.set(sellerId, [item]);
  }
  return [...groups].map(([sellerId, groupItems]) => ({ sellerId, items: groupItems }));
}

type ShippedCartItem = Pick<CartItem, 'shippingCosts'> & { product: Pick<CartItem['product'], 'title'> };

export interface CartShipping {
  /** Frais de port cumulés : PayPal les ajoute article par article. */
  amount: number;
  /** Articles que le vendeur ne livre pas par cette méthode. */
  undeliverable: string[];
}

export function cartShipping(items: ShippedCartItem[], method: ShippingMethod): CartShipping {
  const costs: number[] = [];
  const undeliverable: string[] = [];
  for (const item of items) {
    const cost = item.shippingCosts?.[method];
    if (cost === null || cost === undefined) {
      undeliverable.push(item.product.title);
    } else {
      costs.push(cost);
    }
  }
  return { amount: sumAmounts(costs), undeliverable };
}
