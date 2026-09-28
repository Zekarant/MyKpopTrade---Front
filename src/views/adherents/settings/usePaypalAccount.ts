import { reactive } from 'vue';
import paymentService from '@/services/payment.service';
import type { PayPalBlockReason } from '@/services/payment.service';

export interface PaypalAccountState {
  connected: boolean;
  email: string | null;
  legalName: string | null;
  merchantId: string | null;
  scopes: string[];
  blockReason: PayPalBlockReason | null;
  blockMessage: string | null;
}

export type PaypalAccount = PaypalAccountState & {
  /** `refresh` force l'API à réinterroger PayPal plutôt que son cache. */
  load(refresh?: boolean): Promise<void>;
};

const disconnected = (): PaypalAccountState => ({
  connected: false,
  email: null,
  legalName: null,
  merchantId: null,
  scopes: [],
  blockReason: null,
  blockMessage: null
});

/**
 * Statut PayPal du vendeur. Il est chargé par la page, pas par la section
 * Paiements : le retour d'onboarding PayPal arrive sur la page sans section et
 * doit afficher son message quelle que soit la section ouverte.
 */
export function usePaypalAccount(): PaypalAccount {
  const account = reactive({
    ...disconnected(),
    async load(refresh = false) {
      try {
        const res = await paymentService.getPayPalAccountStatus(refresh);
        Object.assign(account, {
          connected: !!res.connected,
          email: res.email || null,
          legalName: res.legalName || null,
          merchantId: res.merchantId || null,
          scopes: res.scopes || [],
          blockReason: res.blockReason,
          // Pas de message d'alerte tant que le vendeur n'a rien connecté :
          // la carte affiche déjà le bouton de connexion.
          blockMessage: res.merchantId ? res.blockMessage : null
        });
      } catch {
        Object.assign(account, disconnected());
      }
    }
  });
  return account as PaypalAccount;
}
