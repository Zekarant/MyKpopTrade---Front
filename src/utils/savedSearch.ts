import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import type { AdvancedSearchPayload } from '@/services/search.service';
import type { SavedSearchCriteria } from '@/services/savedSearch.service';

/** Longueur maximale d'un nom de recherche, alignée sur l'API. */
export const SAVED_SEARCH_NAME_MAX_LENGTH = 60;

const TYPE_LABELS: Record<string, string> = {
  photocard: 'Photocards',
  album: 'Albums',
  merch: 'Merch',
  other: 'Autres articles'
};

/** Noms affichables des groupes / albums du catalogue, par identifiant. */
export type CatalogLabels = Record<string, string>;

/** Critères à enregistrer : la requête de la recherche avancée, sans pagination ni tri. */
export function criteriaFromPayload(payload: AdvancedSearchPayload): SavedSearchCriteria {
  const criteria: SavedSearchCriteria = {};
  if (payload.query?.trim()) criteria.query = payload.query.trim();
  if (payload.groups?.length) criteria.groups = payload.groups;
  if (payload.members?.length) criteria.members = payload.members;
  if (payload.albums?.length) criteria.albums = payload.albums;
  if (payload.priceRange && (payload.priceRange.min !== undefined || payload.priceRange.max !== undefined)) {
    criteria.priceRange = payload.priceRange;
  }
  if (payload.condition?.length) criteria.condition = payload.condition;
  if (payload.type) criteria.type = payload.type;
  if (payload.currency) criteria.currency = payload.currency;
  if (payload.group) criteria.group = payload.group;
  if (payload.member) criteria.member = payload.member;
  if (payload.album) criteria.album = payload.album;
  if (payload.version) criteria.version = payload.version;
  if (payload.isOfficial !== undefined) criteria.isOfficial = payload.isOfficial;
  return criteria;
}

export function hasCriteria(criteria: SavedSearchCriteria): boolean {
  return Object.keys(criteria).length > 0;
}

const groupLabel = (criteria: SavedSearchCriteria, labels: CatalogLabels) =>
  (criteria.group && labels[criteria.group]) || criteria.groups?.join(', ');

const memberLabel = (criteria: SavedSearchCriteria) => criteria.member || criteria.members?.join(', ');

/** Nom proposé par défaut : ce que l'on cherche, lisible d'un coup d'œil dans la liste. */
export function defaultSavedSearchName(criteria: SavedSearchCriteria, labels: CatalogLabels = {}): string {
  const parts = [
    criteria.query && `« ${criteria.query} »`,
    groupLabel(criteria, labels),
    memberLabel(criteria),
    criteria.type && TYPE_LABELS[criteria.type]
  ].filter(Boolean);
  const name = parts.length ? parts.join(' · ') : 'Ma recherche';
  return name.slice(0, SAVED_SEARCH_NAME_MAX_LENGTH);
}

/** Résumé des critères affiché sous le nom d'une recherche sauvegardée. */
export function describeCriteria(criteria: SavedSearchCriteria, labels: CatalogLabels = {}): string[] {
  const { min, max } = criteria.priceRange ?? {};
  const group = groupLabel(criteria, labels) || (criteria.group && 'groupe du catalogue');
  const album = (criteria.album && (labels[criteria.album] || 'album du catalogue')) || criteria.albums?.join(', ');
  return [
    criteria.query && `Texte : ${criteria.query}`,
    group && `Groupe : ${group}`,
    memberLabel(criteria) && `Membre : ${memberLabel(criteria)}`,
    album && `Album : ${album}`,
    criteria.version && `Version : ${criteria.version}`,
    criteria.isOfficial === true && 'Officiels uniquement',
    criteria.isOfficial === false && 'Non officiels',
    criteria.type && `Type : ${TYPE_LABELS[criteria.type] ?? criteria.type}`,
    criteria.condition?.length && `État : ${criteria.condition.join(', ')}`,
    min !== undefined && max !== undefined && `Prix : ${min} – ${max}`,
    min !== undefined && max === undefined && `Prix : dès ${min}`,
    min === undefined && max !== undefined && `Prix : jusqu'à ${max}`
  ].filter((part): part is string => typeof part === 'string');
}

/**
 * Lien « Lancer » : tous les critères passent par la query de /search, le
 * texte dans `q` comme sur la page de recherche.
 * Les clés reprennent les filtres de la page : `group` / `member` portent des
 * noms, `groupId` / `albumId` des identifiants du catalogue.
 */
export function searchRouteForCriteria(criteria: SavedSearchCriteria): RouteLocationRaw {
  const query: LocationQueryRaw = {};
  if (criteria.query) query.q = criteria.query;
  if (criteria.groups?.length) query.group = criteria.groups[0];
  if (criteria.group) query.groupId = criteria.group;
  const member = criteria.member || criteria.members?.[0];
  if (member) query.member = member;
  if (criteria.album) query.albumId = criteria.album;
  if (criteria.version) query.version = criteria.version;
  if (criteria.isOfficial) query.official = 'true';
  if (criteria.type) query.type = criteria.type;
  if (criteria.condition?.length) query.condition = criteria.condition;
  if (criteria.priceRange?.min !== undefined) query.min = String(criteria.priceRange.min);
  if (criteria.priceRange?.max !== undefined) query.max = String(criteria.priceRange.max);
  return { name: 'searchList', query };
}

/** Critères portés par l'URL de la page de recherche, au format de ses filtres. */
export interface UrlSearchCriteria {
  query: string | null;
  filters: {
    min: number | null;
    max: number | null;
    conditions: string[] | null;
    type: string | null;
    group: string | null;
    groupId: string | null;
    member: string | null;
    albumId: string | null;
    version: string | null;
    isOfficial: boolean;
  };
}

const firstValue = (value: LocationQuery[string] | undefined): string | null => {
  const first = Array.isArray(value) ? value[0] : value;
  return first ? String(first) : null;
};

const numberValue = (value: LocationQuery[string] | undefined): number | null => {
  const raw = firstValue(value);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const URL_CRITERIA_KEYS = [
  'q', 'group', 'groupId', 'member', 'albumId', 'version', 'official', 'type', 'condition', 'min', 'max'
];

/** `null` quand l'URL ne porte aucun critère : les filtres en cours sont alors conservés. */
export function criteriaFromRouteQuery(query: LocationQuery): UrlSearchCriteria | null {
  if (!URL_CRITERIA_KEYS.some((key) => query[key] !== undefined)) return null;
  const conditions = ([] as (string | null)[]).concat(query.condition ?? [])
    .filter((condition): condition is string => Boolean(condition));
  return {
    query: firstValue(query.q),
    filters: {
      min: numberValue(query.min),
      max: numberValue(query.max),
      conditions: conditions.length ? conditions : null,
      type: firstValue(query.type),
      group: firstValue(query.group),
      groupId: firstValue(query.groupId),
      member: firstValue(query.member),
      albumId: firstValue(query.albumId),
      version: firstValue(query.version),
      isOfficial: firstValue(query.official) === 'true'
    }
  };
}
