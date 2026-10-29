import { formatDistanceToNowStrict } from 'date-fns';
import { apiErrorBody } from '@/services/apiError';
import { fr } from 'date-fns/locale';
import {
  formatDate as sharedFormatDate,
  formatDateTime as sharedFormatDateTime,
  formatPrice as sharedFormatPrice
} from '@/utils/format';

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
  post: 'Publication',
  message: 'Message'
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

export const MODERATION_CATEGORY_LABELS: Record<string, string> = {
  counterfeit: 'Contrefaçon',
  off_platform_payment: 'Paiement hors plateforme',
  prohibited_item: 'Objet interdit',
  other: 'Autre'
};

export const MODERATION_CONFIDENCE_LABELS: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée'
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

// Formatage partagé avec le reste du site ; l'admin affiche « — » pour une valeur absente.
export const formatDate = (value?: string | Date | null): string => sharedFormatDate(value) || '—';

export const formatDateTime = (value?: string | Date | null): string => sharedFormatDateTime(value) || '—';

export const formatAge = (value?: string | Date | null): string => {
  if (!value) return '—';
  return formatDistanceToNowStrict(new Date(value), { locale: fr });
};

export const getInitial = (username?: string | null): string =>
  username ? username.charAt(0).toUpperCase() : '?';

export const formatPrice = (amount?: number, currency = 'EUR'): string =>
  sharedFormatPrice(amount, currency) || '—';

type ApiErrorBody = { message?: string; error?: { message?: string } };

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  const data = apiErrorBody<ApiErrorBody>(error);
  return data?.message || data?.error?.message || fallback;
};
