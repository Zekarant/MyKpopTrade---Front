import type { CartCheckoutPayment } from '@/services/cart.service';
import type { PendingPaypalPayment } from './types';

/**
 * Paiements PayPal d'un checkout panier multi-vendeurs restant à approuver :
 * PayPal n'approuve qu'un ordre à la fois, success.vue enchaîne sur le suivant
 * et cancel.vue annule ceux qui restent, comme success.vue quand un paiement échoue.
 */
export const PENDING_PAYPAL_PAYMENTS_KEY = 'pendingPaypalPayments';

function isPendingPayment(value: unknown): value is PendingPaypalPayment {
  if (typeof value === 'string') return true;
  return typeof value === 'object' && value !== null && 'approvalUrl' in value && typeof value.approvalUrl === 'string';
}

export function pendingApprovalUrl(payment: PendingPaypalPayment): string {
  return typeof payment === 'string' ? payment : payment.approvalUrl;
}

/** Ordre PayPal à annuler ; absent de l'ancien format (URL seule). */
export function pendingOrderId(payment: PendingPaypalPayment): string | undefined {
  return typeof payment === 'string' ? undefined : payment.orderId;
}

export function readPendingPayments(storage: Storage = localStorage): PendingPaypalPayment[] {
  const raw = storage.getItem(PENDING_PAYPAL_PAYMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingPayment) : [];
  } catch {
    return [];
  }
}

function writePendingPayments(payments: PendingPaypalPayment[], storage: Storage): void {
  if (payments.length > 0) {
    storage.setItem(PENDING_PAYPAL_PAYMENTS_KEY, JSON.stringify(payments));
  } else {
    storage.removeItem(PENDING_PAYPAL_PAYMENTS_KEY);
  }
}

/**
 * Mémorise les paiements à approuver après le premier. Une liste vide efface
 * aussi les restes d'un checkout abandonné, que success.vue suivrait sinon.
 */
export function savePendingPayments(
  payments: Pick<CartCheckoutPayment, 'approvalUrl' | 'paypalOrderId'>[],
  storage: Storage = localStorage
): void {
  writePendingPayments(
    payments.map((payment) => ({ approvalUrl: payment.approvalUrl, orderId: payment.paypalOrderId })),
    storage
  );
}

/** Retire et renvoie le prochain paiement à approuver. */
export function takeNextPendingPayment(storage: Storage = localStorage): PendingPaypalPayment | undefined {
  const [next, ...rest] = readPendingPayments(storage);
  writePendingPayments(rest, storage);
  return next;
}

/** Vide la liste et renvoie les ordres PayPal à annuler. */
export function takePendingOrderIds(storage: Storage = localStorage): string[] {
  const orderIds = readPendingPayments(storage)
    .map(pendingOrderId)
    .filter((orderId): orderId is string => Boolean(orderId));
  storage.removeItem(PENDING_PAYPAL_PAYMENTS_KEY);
  return orderIds;
}

/**
 * Annule chaque ordre restant ; un échec (ordre déjà annulé ou expiré) n'arrête
 * pas les suivants. Sans cela, les paiements restent en attente côté back.
 */
export async function cancelPendingPayments(
  cancelOrder: (orderId: string) => Promise<unknown>,
  storage: Storage = localStorage
): Promise<void> {
  for (const orderId of takePendingOrderIds(storage)) {
    try {
      await cancelOrder(orderId);
    } catch {
      // Déjà annulé ou expiré côté PayPal : rien à faire.
    }
  }
}
