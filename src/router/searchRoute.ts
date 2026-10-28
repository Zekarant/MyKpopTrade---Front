import type { LocationQuery, LocationQueryRaw, RouteLocationGeneric, RouteLocationRaw } from 'vue-router';

/**
 * Page de recherche : `/search?q=…&event=…`, plus les critères des recherches
 * sauvegardées (`group`, `member`…, cf. utils/savedSearch).
 *
 * `event` ne sert qu'aux listes transmises par une autre page (« Voir plus »
 * de la grille ou du tableau de bord) : la page restaure alors les articles
 * déjà chargés au lieu de lancer une recherche (`morePage`, `morePageFavorites`…).
 */
export interface SearchPageProps {
  query: string;
  event: string;
}

const firstString = (value: LocationQuery[string] | undefined): string => {
  const first = Array.isArray(value) ? value[0] : value;
  return first ? String(first) : '';
};

export function searchPageProps(route: Pick<RouteLocationGeneric, 'query'>): SearchPageProps {
  return { query: firstString(route.query.q), event: firstString(route.query.event) };
}

/** Lien vers la page de recherche ; un texte ou un événement vide n'apparaît pas dans l'URL. */
export function searchRoute({ q, event }: { q?: string; event?: string } = {}): RouteLocationRaw {
  const query: LocationQueryRaw = {};
  if (q) query.q = q;
  if (event) query.event = event;
  return { name: 'searchList', query };
}

const LEGACY_EVENTS = new Set<string>(['morePage', 'search', 'morePageFavorites', 'moreFavorites']);

/**
 * Ancien format `/search-<texte>-<événement>` : le texte et l'événement étaient
 * collés par un tiret, si bien qu'un texte contenant un tiret était tronqué.
 * Seule la première et la dernière partie étaient lues ; on garde ce découpage
 * pour que les anciens liens mènent exactement à la même recherche.
 */
export function parseLegacySearchSlug(combined: string): { q: string; event: string } {
  if (!combined) return { q: '', event: '' };
  const parts = combined.split('-');
  if (parts.length === 1) {
    return LEGACY_EVENTS.has(parts[0]) ? { q: '', event: parts[0] } : { q: parts[0], event: '' };
  }
  return { q: parts[0], event: parts[parts.length - 1] };
}

/** Redirection des anciens liens (favoris, historique, emails) vers `/search?q=…`. */
export function legacySearchRedirect(to: RouteLocationGeneric): RouteLocationRaw {
  const raw = to.params.combined;
  const { q, event } = parseLegacySearchSlug(Array.isArray(raw) ? raw.join('-') : (raw ?? ''));
  const query: LocationQueryRaw = { ...to.query };
  if (q) query.q = q;
  if (event) query.event = event;
  return { name: 'searchList', query, hash: to.hash };
}
