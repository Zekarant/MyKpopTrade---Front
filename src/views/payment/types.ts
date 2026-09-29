/**
 * Entrée de `pendingPaypalPayments` (localStorage) : ancien format URL seule, ou objet écrit par le panier.
 * `orderId` est le `paypalOrderId` renvoyé par le checkout, celui qu'attend /payments/paypal/cancel.
 */
export type PendingPaypalPayment = string | { approvalUrl: string; orderId?: string };
