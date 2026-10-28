import { defineStore } from 'pinia';
import cartService from '@/services/cart.service';

/**
 * Nombre d'articles du panier, affiché en badge dans la barre de navigation.
 * Les vues qui modifient le panier le mettent à jour ici, la barre suit.
 */
export const useCartStore = defineStore('cart', {
  state: () => ({
    count: 0
  }),

  actions: {
    async refresh() {
      try {
        const cart = await cartService.getCart();
        this.count = cart?.items?.length ?? 0;
      } catch {
        // Un badge absent ne doit pas bloquer la page : on garde la valeur connue.
      }
    },

    setCount(count: number) {
      this.count = count;
    },

    reset() {
      this.count = 0;
    }
  }
});
