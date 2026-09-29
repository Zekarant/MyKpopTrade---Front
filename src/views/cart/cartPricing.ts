import type { CartItem } from '@/services/cart.service';

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
  return items.reduce((sum, item) => sum + cartItemPrice(item), 0);
}
