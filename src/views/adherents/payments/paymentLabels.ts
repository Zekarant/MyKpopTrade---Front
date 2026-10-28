import type { Payment } from './types';

/** Libellés et icônes d'affichage des paiements et de leur suivi de colis. */

const STATUS_LABELS: Record<Payment['status'], string> = {
  pending: 'En attente',
  completed: 'Payé',
  failed: 'Échec',
  refunded: 'Remboursé',
  partially_refunded: 'Remboursé (partiel)',
  cancelled: 'Annulé',
};

const TIMELINE_LABELS: Record<string, string> = {
  shipped: 'Expédié',
  in_transit: 'En transit',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livré',
  exception: 'Anomalie de livraison',
  returned: 'Retourné',
  unknown: 'Mise à jour',
};

const DEFAULT_TIMELINE_ICON = 'bi bi-info-circle';
const TIMELINE_ICONS: Record<string, string> = {
  shipped: 'bi bi-box-seam',
  in_transit: 'bi bi-truck',
  out_for_delivery: 'bi bi-geo-alt',
  delivered: 'bi bi-check2-circle',
  exception: 'bi bi-exclamation-triangle',
  returned: 'bi bi-arrow-counterclockwise',
  unknown: DEFAULT_TIMELINE_ICON,
};

const SOURCE_LABELS: Record<string, string> = {
  seller: 'vendeur',
  buyer: 'acheteur',
  carrier: 'transporteur',
  system: 'auto',
};

// Statut inconnu (ajouté côté API après ce code) : affiché brut plutôt que masqué.
export const statusLabel = (status: Payment['status']): string => STATUS_LABELS[status] || status;
export const timelineLabel = (status: string): string => TIMELINE_LABELS[status] || status;
export const timelineIcon = (status: string): string => TIMELINE_ICONS[status] || DEFAULT_TIMELINE_ICON;
export const sourceLabel = (source: string): string => SOURCE_LABELS[source] || source;
