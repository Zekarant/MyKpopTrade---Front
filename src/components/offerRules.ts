/**
 * Règles d'offre d'une annonce, alignées sur le back (conversationOfferService) :
 * - prix libre : l'offre doit tenir dans [pwywMinPrice, pwywMaxPrice], même sans allowOffers ;
 * - sinon : au moins minOfferPercentage % du prix (50 % par défaut), et sous le prix demandé.
 */

import { formatPrice } from '@/utils/format';
import type { OfferSettings } from '@/types/post.types';

export interface OfferPricing extends OfferSettings {
  price: number;
}

/** Annonce visée par une offre : fiche produit, ou produit peuplé d'une conversation. */
export type OfferProduct = Partial<Omit<OfferPricing, 'price'>> & {
  _id: string;
  title: string;
  price?: number;
  /** Devise de l'annonce (EUR si absente). */
  currency?: string;
  images?: string[];
};

export interface OfferConversation {
  _id?: string;
  id?: string;
  productId?: OfferProduct | null;
}

/** Offre saisie dans send_offer.vue, que le parent ouvre en négociation. */
export interface OfferSentPayload {
  amount: number;
  message: string;
  offerData: {
    productId: string;
    amount: number;
    message: string;
    conversationId: string | null;
  };
}

/** Valeur appliquée par le back quand l'annonce n'en précise pas. */
export const DEFAULT_MIN_OFFER_PERCENTAGE = 50;

export type OfferBounds =
  | { mode: 'pwyw'; min: number; max: number | null }
  | { mode: 'negotiation'; min: number; minPercentage: number; price: number };

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

/** « à partir de 5,00 € » ou « entre 5,00 € et 30,00 € » (même rendu que les prix des annonces). */
export function pwywRangeLabel(min: number | null | undefined, max: number | null | undefined, currency = 'EUR'): string {
  const floor = formatPrice(min ?? 0, currency);
  return max ? `entre ${floor} et ${formatPrice(max, currency)}` : `à partir de ${floor}`;
}

/** @returns le message à afficher, ou `null` si l'offre est recevable. */
export function validateOfferAmount(
  amount: number | null | undefined,
  pricing: OfferPricing,
  currency = 'EUR'
): string | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return 'Indiquez un montant supérieur à 0.';
  }

  const bounds = offerBounds(pricing);
  if (bounds.mode === 'pwyw') {
    if (amount < bounds.min) {
      return `Le prix libre commence à ${formatPrice(bounds.min, currency)}.`;
    }
    if (bounds.max !== null && amount > bounds.max) {
      return `Le prix libre ne dépasse pas ${formatPrice(bounds.max, currency)}.`;
    }
    return null;
  }

  if (amount < bounds.min) {
    return `L'offre minimum est de ${formatPrice(bounds.min, currency)} (${bounds.minPercentage} % du prix).`;
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
