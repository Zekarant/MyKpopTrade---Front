import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  photocard: 'Photocard',
  album: 'Album',
  merch: 'Merch',
  other: 'Autre'
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Contenu inapproprié',
  offensive_language: 'Langage offensant',
  false_information: 'Fausses informations',
  spam: 'Spam',
  fraud: 'Fraude',
  copyright_violation: 'Droit d\'auteur',
  other: 'Autre'
};

export const REPORT_TARGET_LABELS: Record<string, string> = {
  product: 'Produit',
  rating: 'Avis',
  user: 'Profil',
  post: 'Publication'
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  reviewed: 'Examiné',
  resolved: 'Résolu',
  rejected: 'Rejeté'
};

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  opened: 'Ouvert',
  under_review: 'En arbitrage',
  resolved: 'Résolu (vendeur)',
  refunded: 'Remboursé',
  rejected: 'Rejeté',
  cancelled: 'Annulé'
};

export const DISPUTE_REASON_LABELS: Record<string, string> = {
  not_received: 'Colis non reçu',
  damaged: 'Colis endommagé',
  not_as_described: 'Non conforme',
  counterfeit: 'Contrefaçon',
  wrong_item: 'Mauvais article',
  partial_delivery: 'Livraison partielle',
  seller_unresponsive: 'Vendeur silencieux',
  buyer_abuse: 'Comportement acheteur',
  other: 'Autre'
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  deleted: 'Supprimé'
};

export const ROLE_LABELS: Record<string, string> = {
  user: 'Utilisateur',
  moderator: 'Modérateur',
  admin: 'Admin'
};

export const formatDate = (value?: string | Date | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatAge = (value?: string | Date | null): string => {
  if (!value) return '—';
  return formatDistanceToNowStrict(new Date(value), { locale: fr });
};

export const getInitial = (username?: string | null): string =>
  username ? username.charAt(0).toUpperCase() : '?';

export const formatPrice = (amount?: number, currency = 'EUR'): string => {
  if (amount === undefined || amount === null) return '—';
  return `${amount.toFixed(2)} ${currency === 'EUR' ? '€' : currency}`;
};

export const apiErrorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.message || error?.response?.data?.error?.message || fallback;
