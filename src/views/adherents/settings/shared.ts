import { createApiClient } from '@/services/http';
import { API_URL } from '@/config/api';

/** Adresse de facturation, telle que stockée par l'API. */
export interface BillingAddress {
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  country: string;
}

/** Profil renvoyé par GET /api/auth/profile : seuls les champs lus par la page. */
export interface SettingsProfile {
  _id?: string;
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  socialLinks?: { instagram?: string; twitter?: string; discord?: string };
  socialAuth?: { google?: { id?: string }; discord?: { id?: string } };
  isEmailVerified?: boolean;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  isIdentityVerified?: boolean;
  legalName?: string;
  address?: BillingAddress | null;
  preferences?: { allowDirectMessages?: boolean };
  marketingConsent?: boolean;
  accountStatus?: string;
  profileCompleted?: boolean;
  anonymized?: boolean;
  scheduledDeletionDate?: string | null;
}

/**
 * Contrat : `patch` met à jour le profil en place, `reloadProfile` remplace l'objet ; une section
 * qui surveille la référence `profile` ne resynchronise donc ses champs qu'au rechargement complet.
 */
export interface SectionProps {
  profile: SettingsProfile;
  reloadProfile: () => Promise<void>;
}

/** Client partagé : renouvelle la session expirée et rejoue la requête. */
export const api = createApiClient({ baseURL: API_URL });

/** Forme utile d'une erreur axios, sans passer par `any`. */
type ApiError = { response?: { status?: number; data?: { message?: string; code?: string } } };

export function apiMessage(error: unknown, fallback: string): string {
  return (error as ApiError)?.response?.data?.message || fallback;
}

export function apiStatus(error: unknown): number | undefined {
  return (error as ApiError)?.response?.status;
}

/**
 * Un 401 qui remonte jusqu'ici signifie que le renouvellement a échoué : le
 * client a déjà effacé la session et redirigé vers /login. Rien à afficher.
 */
export function isSessionLost(error: unknown): boolean {
  return apiStatus(error) === 401;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
