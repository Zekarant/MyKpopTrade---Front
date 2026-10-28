import paymentService from '@/services/payment.service';
import { redirectToPayPal } from '@/views/payment/paypalUrl';

/** Résultat rendu par CheckoutDialog après la création de l'ordre PayPal. */
export interface CheckoutResult {
  success?: boolean;
  payment?: { approvalUrl?: string; paypalOrderId?: string };
}

/**
 * Suite d'un achat confirmé dans CheckoutDialog : redirection complète vers
 * PayPal (l'acheteur approuve puis revient sur /payment/success).
 *
 * L'URL d'approbation vient de PayPal via l'API, on ne la reconstruit jamais ;
 * on vérifie seulement qu'elle mène bien à PayPal. Sinon l'ordre, créé mais
 * inutilisable, est annulé pour ne pas laisser de paiement en attente.
 */
export function followCheckoutResult(
  result: CheckoutResult | null | undefined,
  showError: (message: string) => void
): void {
  if (result?.success && redirectToPayPal(result.payment?.approvalUrl)) return;

  const orderId = result?.payment?.paypalOrderId;
  if (orderId) paymentService.cancelPayPal(orderId).catch(() => {});
  showError('Erreur lors de l\'initialisation du paiement. Veuillez réessayer.');
}
