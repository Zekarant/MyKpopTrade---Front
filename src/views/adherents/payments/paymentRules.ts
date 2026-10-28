import { toCents } from '@/utils/money';
import type { Payment, PaymentRole, Refund } from './types';

/**
 * Règles d'un paiement côté interface : rôle de l'utilisateur, actions
 * permises et montants remboursés. Les sommes se font en centimes entiers :
 * en flottants, 0,1 + 0,2 ne vaut pas 0,3 et le restant remboursable dériverait.
 */

/** Onglet initial : `?role=` vient des liens de notification (achat / vente). */
export function roleFromQuery(value: unknown): PaymentRole {
  return value === 'buyer' || value === 'seller' ? value : 'all';
}

const idOf = (party: Payment['buyer']): string | undefined => (typeof party === 'string' ? party : party?._id);

export const isSeller = (p: Payment, userId: string): boolean => idOf(p.seller) === userId;
export const isBuyer = (p: Payment, userId: string): boolean => idOf(p.buyer) === userId;

/** Remboursements réellement aboutis — les entrées en attente ne comptent pas. */
export const completedRefunds = (p: Payment): Refund[] => (p.refunds || []).filter((r) => r.status === 'completed');

/** Remboursements en attente ou échoués — signalés par un simple badge. */
export const unsettledRefunds = (p: Payment): Refund[] => (p.refunds || []).filter((r) => r.status !== 'completed');

/**
 * Total remboursé, calculé sur l'historique plutôt que sur `totalRefunded`
 * seul : le back retient la valeur la plus prudente des deux, on fait pareil
 * pour que l'affichage ne contredise jamais le restant remboursable.
 */
export function refundedCents(p: Payment): number {
  const fromHistory = completedRefunds(p).reduce((sum, r) => sum + toCents(r.amount), 0);
  return Math.max(fromHistory, toCents(p.totalRefunded));
}

export const refundableCents = (p: Payment): number => Math.max(0, toCents(p.amount) - refundedCents(p));

/** Ce que le paiement rapporte encore au vendeur (ou coûte encore à l'acheteur). */
export const netCents = (p: Payment): number => toCents(p.amount) - refundedCents(p);

export const canMarkDelivered = (p: Payment, userId: string): boolean =>
  isSeller(p, userId) && p.shipment?.status === 'shipped';

// Les trois règles suivantes servaient aux boutons « Expédier », « Rembourser »
// et « Litige », retirés de la carte (commit 36151ea) : gardées pour leur retour.
export const canCreateShipment = (p: Payment, userId: string): boolean =>
  isSeller(p, userId) && p.status === 'completed' && !p.shipment;

export const canRefund = (p: Payment, userId: string): boolean =>
  isSeller(p, userId)
  && (p.status === 'completed' || p.status === 'partially_refunded')
  && refundableCents(p) > 0;

export const canOpenDispute = (p: Payment, userId: string): boolean =>
  (isBuyer(p, userId) || isSeller(p, userId))
  && (p.status === 'completed' || p.status === 'partially_refunded');
