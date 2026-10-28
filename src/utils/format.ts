import { API_URL } from '@/config/api';

/**
 * Formatage partagé de l'interface : prix, dates et URL des médias servis par
 * l'API. Une seule implémentation, pour qu'une même donnée s'affiche de la même
 * façon sur toutes les pages.
 *
 * Une valeur absente ou illisible donne une chaîne vide, jamais « Invalid Date »
 * ni « NaN € » : à l'appelant de choisir son repli (« — », masquage…).
 */

const LOCALE = 'fr-FR';

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Un Intl.NumberFormat coûte cher à construire et les listes en formatent des
// dizaines : un formateur par devise suffit.
const priceFormatters = new Map<string, Intl.NumberFormat>();

/** Montant dans sa devise, à la française : « 1 234,50 € ». */
export function formatPrice(amount: number | null | undefined, currency = 'EUR'): string {
  const value = Number(amount);
  if (amount === null || amount === undefined || !Number.isFinite(value)) return '';

  let formatter = priceFormatters.get(currency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency });
    } catch {
      // Code devise inconnu d'Intl (donnée ancienne ou saisie libre) : on
      // affiche le montant brut plutôt que de faire planter le rendu.
      return `${value.toFixed(2)} ${currency}`;
    }
    priceFormatters.set(currency, formatter);
  }
  return formatter.format(value);
}

const DATE_OPTIONS: Record<'short' | 'long', Intl.DateTimeFormatOptions> = {
  // « 09 oct. 2026 » : listes et historiques, où la place est comptée.
  short: { day: '2-digit', month: 'short', year: 'numeric' },
  // « 9 octobre 2026 » : phrases (« inscrit le… », « supprimé le… »).
  long: { day: 'numeric', month: 'long', year: 'numeric' }
};

export function formatDate(value: DateInput, style: 'short' | 'long' = 'short'): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString(LOCALE, DATE_OPTIONS[style]) : '';
}

/** « 09 oct. 2026, 14:05 » */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  return date
    ? date.toLocaleString(LOCALE, { ...DATE_OPTIONS.short, hour: '2-digit', minute: '2-digit' })
    : '';
}

/**
 * Ancienneté compacte (« À l'instant », « 5 min », « 3h », « 2j », « 3 sem. »,
 * « 4 mois ») ; au-delà d'un an, la date elle-même. Pensé pour les
 * notifications, où un horodatage complet serait illisible.
 */
export function formatRelative(value: DateInput, now: number = Date.now()): string {
  const date = toDate(value);
  if (!date) return '';

  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)} sem.`;
  if (days < 365) return `${Math.floor(days / 30)} mois`;
  return date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

// Avatars Google / Discord, images en cours d'envoi (aperçus base64 ou blob) :
// déjà utilisables tels quels.
const ABSOLUTE_URL = /^(?:https?:|data:|blob:)/i;

/** URL d'un média de l'API (« /uploads/… »), ou l'URL absolue reçue telle quelle. */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (ABSOLUTE_URL.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
