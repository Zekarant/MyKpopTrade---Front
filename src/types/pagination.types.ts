/**
 * Pagination de toutes les listes de l'API (`paginationMeta` côté back) :
 * `total` éléments répartis sur `pages` pages de `limit` éléments.
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
