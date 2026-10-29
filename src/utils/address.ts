import type { ShippingAddressPayload } from '@/services/payment.service';

/**
 * Adresses saisies dans l'interface : mêmes règles partout, alignées sur le back
 * (validateShippingAddress : champs requis, pays en code ISO à deux lettres).
 */

/** Longueur maximale d'un code postal, comme côté back. */
export const POSTAL_CODE_MAX_LENGTH = 16;

interface PostalFields {
  streetLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
}

const filled = (value: string | null | undefined) => Boolean(value?.trim());

/** Adresse postale du compte (paramètres, PayPal) : rue, code postal et ville. */
export function isPostalAddressComplete(address: PostalFields): boolean {
  return filled(address.streetLine1) && filled(address.postalCode) && filled(address.city);
}

/** Adresse de livraison : l'adresse postale plus le nom du destinataire ; le pays vaut FR par défaut. */
export function isShippingAddressComplete(address: PostalFields & { recipientName?: string | null }): boolean {
  return filled(address.recipientName) && isPostalAddressComplete(address);
}

/** Adresse de livraison envoyée au back : champs nettoyés, pays en majuscules (FR par défaut), facultatifs vides omis. */
export function toShippingAddressPayload(address: ShippingAddressPayload): ShippingAddressPayload {
  return {
    recipientName: address.recipientName.trim(),
    streetLine1: address.streetLine1.trim(),
    streetLine2: address.streetLine2?.trim() || undefined,
    postalCode: address.postalCode.trim(),
    city: address.city.trim(),
    country: (address.country?.trim() || 'FR').toUpperCase(),
    phone: address.phone?.trim() || undefined
  };
}
