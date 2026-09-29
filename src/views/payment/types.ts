/** Entrée de `pendingPaypalPayments` (localStorage) : ancien format URL seule, ou objet écrit par le panier. */
export type PendingPaypalPayment = string | { approvalUrl: string; orderId?: string };
