/**
 * Chemin de retour après connexion, lu dans `?redirect=`.
 *
 * N'importe qui peut forger ce paramètre : seul un chemin interne est accepté,
 * sinon un lien piégé renverrait l'utilisateur fraîchement connecté vers un
 * site tiers (redirection ouverte). `//hote` et `/\hote` sont des URL absolues
 * pour le navigateur, d'où leur exclusion.
 */
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
