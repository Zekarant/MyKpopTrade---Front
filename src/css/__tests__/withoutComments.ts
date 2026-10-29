/**
 * Source sans commentaires, pour les garde-fous CSS : un `!important` ou un
 * `--token:` cité en commentaire ne compte pas. Un `//` précédé de `:`, `(` ou
 * d'un guillemet (URL `https://…`, `url(//cdn…)`) n'ouvre pas de commentaire.
 */
export function withoutComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\/|(^|[^:('"])\/\/[^\n]*/gm, (_match, before: string | undefined) => before ?? '')
}
