/**
 * Arithmétique monétaire en centimes entiers : additionner des flottants
 * (0.1 + 0.2 = 0.30000000000000004) finit par afficher ou comparer un total
 * faux. Les montants entrent et sortent en unités (euros), comme l'API les
 * échange ; seuls les calculs intermédiaires passent par les centimes.
 */

/** Montant en unités → centimes entiers. Une valeur absente ou illisible compte pour 0. */
export function toCents(amount: number | null | undefined): number {
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Somme exacte de montants en unités. */
export function sumAmounts(amounts: readonly number[]): number {
  return fromCents(amounts.reduce((cents, amount) => cents + toCents(amount), 0));
}
