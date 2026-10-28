import type { ShippingMethod } from '@/services/payment.service';

/** Options de livraison telles qu'une annonce les expose (anciennes annonces comprises). */
export interface ShippingOptionsLike {
  worldwide?: boolean;
  nationalOnly?: boolean;
  localPickup?: boolean;
  nationalCost?: number | null;
  worldwideCost?: number | null;
  /** legacy fallback */
  shippingCost?: number | null;
}

export interface ShippingChoice {
  value: ShippingMethod;
  label: string;
  /** Frais de port en unités (euros), comme l'API les facture. */
  cost: number;
}

/** Frais d'une méthode ; `null` si le vendeur n'a pas fixé de tarif. */
export function resolveShippingCost(options: ShippingOptionsLike, method: ShippingMethod): number | null {
  if (method === 'localPickup') return 0;
  if (method === 'national') return options.nationalCost ?? options.shippingCost ?? null;
  return options.worldwideCost ?? options.shippingCost ?? null;
}

/** Méthodes proposées par le vendeur ; sans tarif, une livraison n'est pas proposée. */
export function availableShippingChoices(options: ShippingOptionsLike): ShippingChoice[] {
  const choices: ShippingChoice[] = [];
  const add = (enabled: boolean | undefined, value: ShippingMethod, label: string) => {
    const cost = enabled ? resolveShippingCost(options, value) : null;
    if (cost !== null) choices.push({ value, label, cost });
  };
  add(options.nationalOnly, 'national', 'Livraison nationale');
  add(options.worldwide, 'worldwide', 'Livraison internationale');
  add(options.localPickup, 'localPickup', 'Remise en main propre');
  return choices;
}
