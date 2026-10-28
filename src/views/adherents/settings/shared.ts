import { createApiClient } from '@/services/http';
import { apiErrorStatus } from '@/services/apiError';
import { API_URL } from '@/config/api';
import { formatDate as formatSharedDate } from '@/utils/format';

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

// Lecteurs communs (apiError.ts) : ils comprennent les erreurs de `api` ci-dessus
// comme les `ApiError` rejetées par les services (blocage, RGPD, paiements).
export {
  apiErrorMessage as apiMessage,
  apiErrorStatus as apiStatus,
  apiErrorCode as apiCode
} from '@/services/apiError';

/**
 * Un 401 qui remonte jusqu'ici signifie que le renouvellement a échoué : le
 * client a déjà effacé la session et redirigé vers /login. Rien à afficher.
 */
export function isSessionLost(error: unknown): boolean {
  return apiErrorStatus(error) === 401;
}

/** Dates en toutes lettres dans les phrases des paramètres (« programmée le 9 octobre 2026 »). */
export function formatDate(iso: string): string {
  return formatSharedDate(iso, 'long');
}
