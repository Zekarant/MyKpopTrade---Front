import type { ProductSeller } from '@/types/post.types';

/** Vendeur affiché : celui de l'annonce, ou le profil transmis par le parent. */
export type PostSeller = Partial<ProductSeller> & { id?: string };

/** Pagination d'une liste d'annonces, telle que la transmettent les pages parentes (champs parfois absents). */
export interface ListPagination {
  page?: number;
  pages?: number;
  limit?: number;
  total?: number;
}

/** Reste-t-il des pages à charger ? */
export const hasMorePages = (pagination: ListPagination) => (pagination.page ?? 1) < (pagination.pages ?? 1);

/** Actions du menu « ⋮ » de la fiche. */
export type PostMenuAction = 'copy' | 'report' | 'sold' | 'relist' | 'delete' | 'edit';

/** Confirmations réservées au vendeur. */
export type OwnerDialog = 'sold' | 'relist' | 'delete';
