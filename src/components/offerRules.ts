/**
 * Règles d'offre d'une annonce, alignées sur le back (conversationOfferService) :
 * - prix libre : l'offre doit tenir dans [pwywMinPrice, pwywMaxPrice], même sans allowOffers ;
 * - sinon : au moins minOfferPercentage % du prix (50 % par défaut), et sous le prix demandé.
 */

export interface OfferPricing {
  price: number;
  allowOffers?: boolean;
  minOfferPercentage?: number | null;
  isPayWhatYouWant?: boolean;
  pwywMinPrice?: number | null;
  pwywMaxPrice?: number | null;
}

/** Valeur appliquée par le back quand l'annonce n'en précise pas. */
export const DEFAULT_MIN_OFFER_PERCENTAGE = 50;

export type OfferBounds =
  | { mode: 'pwyw'; min: number; max: number | null }
  | { mode: 'negotiation'; min: number; minPercentage: number; price: number };

const amountFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/** « 12,5 € » : même rendu que les prix affichés sur les annonces. */
export function formatAmount(amount: number, symbol = '€'): string {
  return `${amountFormatter.format(amount)} ${symbol}`;
}

export function acceptsOffers(pricing: Partial<OfferPricing> | null | undefined): boolean {
  return Boolean(pricing?.allowOffers || pricing?.isPayWhatYouWant);
}

/** Arrondi au centime supérieur : l'offre proposée par défaut ne tombe jamais sous le seuil du back. */
function ceilToCents(amount: number): number {
  return Math.ceil(amount * 100 - 1e-9) / 100;
}

export function offerBounds(pricing: OfferPricing): OfferBounds {
  if (pricing.isPayWhatYouWant) {
    return {
      mode: 'pwyw',
      min: pricing.pwywMinPrice ?? 0,
      max: pricing.pwywMaxPrice || null,
    };
  }
  const minPercentage = pricing.minOfferPercentage || DEFAULT_MIN_OFFER_PERCENTAGE;
  return {
    mode: 'negotiation',
    min: ceilToCents((pricing.price * minPercentage) / 100),
    minPercentage,
    price: pricing.price,
  };
}

/** « à partir de 5 € » ou « entre 5 € et 30 € ». */
export function pwywRangeLabel(min: number | null | undefined, max: number | null | undefined, symbol = '€'): string {
  const floor = formatAmount(min ?? 0, symbol);
  return max ? `entre ${floor} et ${formatAmount(max, symbol)}` : `à partir de ${floor}`;
}

/** @returns le message à afficher, ou `null` si l'offre est recevable. */
export function validateOfferAmount(
  amount: number | null | undefined,
  pricing: OfferPricing,
  symbol = '€'
): string | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return 'Indiquez un montant supérieur à 0.';
  }

  const bounds = offerBounds(pricing);
  if (bounds.mode === 'pwyw') {
    if (amount < bounds.min) {
      return `Le prix libre commence à ${formatAmount(bounds.min, symbol)}.`;
    }
    if (bounds.max !== null && amount > bounds.max) {
      return `Le prix libre ne dépasse pas ${formatAmount(bounds.max, symbol)}.`;
    }
    return null;
  }

  if (amount < bounds.min) {
    return `L'offre minimum est de ${formatAmount(bounds.min, symbol)} (${bounds.minPercentage} % du prix).`;
  }
  if (amount >= bounds.price) {
    return 'L\'offre doit être inférieure au prix demandé.';
  }
  return null;
}

/**
 * Valeur d'un champ numérique facultatif : `v-model.number` laisse la chaîne
 * vide quand le champ est effacé.
 */
export function optionalAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Réglage du prix libre par le vendeur : minimum ≥ 0, maximum facultatif et
 * strictement supérieur au minimum (mêmes règles que POST /api/messaging/pwyw).
 */
export function validatePwywSettings(min: unknown, max: unknown): string | null {
  const floor = optionalAmount(min);
  if (floor === null || floor < 0) {
    return 'Indiquez un prix minimum de 0 € ou plus.';
  }
  const hasMax = max !== null && max !== undefined && max !== '';
  if (hasMax) {
    const ceiling = optionalAmount(max);
    if (ceiling === null || ceiling <= floor) {
      return 'Le prix maximum doit être supérieur au prix minimum.';
    }
  }
  return null;
}
