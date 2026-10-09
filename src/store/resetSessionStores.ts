import { getActivePinia } from 'pinia';
import { useUserStore } from '@/store/user.store';
import { useCartStore } from '@/store/cart.store';
import { useNotificationStore } from '@/store/notification.store';
import { useMessagingStore } from '@/store/messaging.store';

/**
 * Vide tout ce qui appartient à l'utilisateur connecté. Appelé à la
 * déconnexion : sans cela, le compte suivant sur le même onglet verrait le
 * profil, le panier ou les conversations du précédent.
 */
export function resetSessionStores(): void {
  // Pas de Pinia active (service appelé hors application, tests) : rien à vider.
  if (!getActivePinia()) return;

  useUserStore().reset();
  useCartStore().reset();
  useNotificationStore().reset();
  useMessagingStore().$reset();
}
