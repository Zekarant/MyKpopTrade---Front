import type { DisputeReason, DisputeStatus } from '@/services/dispute.service';

/** Libellés vus par les membres (l'administration a les siens, cf. admin/adminFormat.ts). */
export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  opened: 'Ouvert',
  under_review: 'En cours d\'examen',
  resolved: 'Résolu (vendeur)',
  refunded: 'Remboursé',
  rejected: 'Rejeté',
  cancelled: 'Retiré'
};

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  not_received: 'Colis non reçu',
  damaged: 'Colis endommagé',
  not_as_described: 'Produit non conforme',
  counterfeit: 'Contrefaçon',
  wrong_item: 'Mauvais article',
  partial_delivery: 'Livraison partielle',
  seller_unresponsive: 'Vendeur ne répond pas',
  buyer_abuse: 'Abus acheteur',
  other: 'Autre'
};
