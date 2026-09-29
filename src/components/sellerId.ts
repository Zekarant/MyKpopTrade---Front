/**
 * Identifiant d'un vendeur : `_id` quand il vient d'une annonce peuplée,
 * `id` quand c'est un profil transmis par la page parente.
 */
export function sellerIdOf(seller: { _id?: string | null; id?: string | null } | null | undefined): string | undefined {
  return seller?._id || seller?.id || undefined;
}
