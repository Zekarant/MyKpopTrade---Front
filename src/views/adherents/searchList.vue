<template>
  <main class="page">
    <div class="content">
      <div class="spacer"></div>
      <div v-if="!isMobile" class="filter_content">
        <filter_list :initial-filters="urlFilters" @save-filter="applyFilter" />
      </div>
      <div class="spacer"></div>
      <div ref="scrollContainer" class="content_grid">
        <search_bar_2 :query="queryLocal" class="search_bar_content" @search="searchEvent" />
        <div class="title_content">
          <span class="result_title">
            <template v-if="page.event === 'morePageFavorites'">Mes favoris</template>
            <template v-else-if="queryLocal">Résultat de la recherche : {{ queryLocal }}</template>
            <template v-else>Tous les articles</template>
          </span>
          <button
            v-if="isLoggedIn && page.event !== 'morePageFavorites'"
            type="button"
            class="save-search-btn"
            :disabled="savingSearch"
            @click="saveCurrentSearch"
          >
            <i class="bi bi-bookmark-plus" aria-hidden="true"></i> Sauvegarder cette recherche
          </button>
          <div v-if="isMobile" class="filter_content">
            <filter_list :initial-filters="urlFilters" @save-filter="applyFilter" />
          </div>
        </div>
        <br>
        <Grid :data-list="posts" />
        <div v-if="pagination.page < pagination.pages" class="load-more-wrap">
          <button type="button" class="load-more-btn" @click="loadMoreResults">Voir plus de résultats</button>
        </div>
        <img
          v-if="isLoadingMore"
          class="imgcenter loading-indicator"
          src="../../assets/images/infinity_scroll.gif"
          alt="Chargement des articles suivants…"
        >
      </div>
      <div class="spacer spacer--end"></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useInfiniteScroll } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import postService from '@/services/post.service';
import searchService, { type AdvancedSearchPayload } from '@/services/search.service';
import savedSearchService from '@/services/savedSearch.service';
import { apiErrorMessage } from '@/services/apiError';
import { hasSession } from '@/services/session.cookies';
import { func } from '@/function';
import { searchPageProps, searchRoute } from '@/router/searchRoute';
import type { Post, PostsResponse } from '@/types/post.types';
import {
  criteriaFromPayload,
  criteriaFromRouteQuery,
  defaultSavedSearchName,
  hasCriteria,
  type UrlSearchCriteria
} from '@/utils/savedSearch';

import search_bar_2 from '@/components/search_bar_2.vue';
import filter_list from '@/components/filter_list.vue';
import Grid from '@/components/grid.vue';

/** Filtres émis par `filter_list` via `saveFilter`. */
interface SearchFilters {
  min: number | null;
  max: number | null;
  /** Le `<select>` en renvoie un seul ; l'URL d'une recherche sauvegardée, un tableau. */
  conditions: string | string[] | null;
  type: string | null;
  group: string | null;
  member: string | null;
  /** Choisis dans le catalogue : filtrent aussi les anciennes annonces côté API. */
  groupId?: string | null;
  albumId?: string | null;
  isOfficial?: boolean;
  /** Pas de champ dans le panneau : seulement rejouée depuis une recherche sauvegardée. */
  version?: string | null;
}

type Pagination = { limit: number; page: number; pages: number };

const MOBILE_MAX_WIDTH = 769;
const DEFAULT_PAGINATION: Pagination = { limit: 10, page: 1, pages: 1 };
/** La recherche avancée renvoie tout d'un coup quand l'API ne précise pas sa pagination. */
const SEARCH_FALLBACK_PAGINATION: Pagination = { limit: 500, page: 1, pages: 1 };

const route = useRoute();
const router = useRouter();

/** Texte et événement lus dans l'URL (`/search?q=…&event=…`). */
const page = computed(() => searchPageProps(route));

const scrollContainer = ref<HTMLElement | null>(null);
const isLoadingMore = ref(false);
const pagination = ref<Pagination>({ ...DEFAULT_PAGINATION });
const posts = ref<Post[]>([]);
const queryLocal = ref('');
const isMobile = ref(window.innerWidth <= MOBILE_MAX_WIDTH);
const isLoggedIn = hasSession();
const savingSearch = ref(false);
/** Critères venus de l'URL, que le panneau de filtres doit afficher. */
const urlFilters = ref<UrlSearchCriteria['filters'] | null>(null);
const filters = ref<SearchFilters>({
  min: null,
  max: null,
  conditions: null,
  type: null,
  group: null,
  member: null
});

/** Page suivante d'une liste transmise par une autre page (grille, favoris). */
async function appendNextPage(fetchPage: (limit: number, page: number) => Promise<PostsResponse>) {
  if (isLoadingMore.value || pagination.value.page >= pagination.value.pages) return;
  isLoadingMore.value = true;
  pagination.value.page++;
  try {
    const result = await fetchPage(pagination.value.limit, pagination.value.page);
    posts.value.push(...result.products);
    pagination.value.pages = result.pagination.pages;
  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    pagination.value.page--;
  } finally {
    isLoadingMore.value = false;
  }
}

// Les résultats d'une recherche se complètent par le bouton « Voir plus » ;
// le défilement infini ne prolonge que les listes venues d'une autre page.
useInfiniteScroll(
  scrollContainer,
  () => {
    if (page.value.event === 'morePage') {
      return appendNextPage((limit, pageNumber) => postService.getPosts(limit, pageNumber));
    }
    if (page.value.event === 'morePageFavorites') {
      return appendNextPage((limit, pageNumber) => postService.getFavorites(limit, pageNumber));
    }
  },
  {
    distance: 200,
    direction: 'bottom',
    canLoadMore: () => pagination.value.pages !== pagination.value.page
  }
);

/**
 * Restaure la liste et la pagination sauvegardées par la grille avant la
 * redirection vers cette page. Renvoie `true` si des articles ont été
 * restaurés (le scroll infini prend ensuite le relais pour les pages
 * suivantes). Le sessionStorage est vidé pour éviter de réutiliser des
 * données périmées lors d'une navigation ultérieure.
 */
function seedFromSession(): boolean {
  try {
    const postsStr = sessionStorage.getItem('posts_str');
    if (!postsStr) return false;
    const savedPosts = JSON.parse(postsStr);
    if (!Array.isArray(savedPosts) || savedPosts.length === 0) return false;
    posts.value = savedPosts;
    const paginationStr = sessionStorage.getItem('pagination_str');
    if (paginationStr) {
      const saved = JSON.parse(paginationStr);
      pagination.value = {
        limit: saved?.limit ?? DEFAULT_PAGINATION.limit,
        page: saved?.page ?? DEFAULT_PAGINATION.page,
        pages: saved?.pages ?? DEFAULT_PAGINATION.pages
      };
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la restauration de la session:', error);
    return false;
  } finally {
    sessionStorage.removeItem('posts_str');
    sessionStorage.removeItem('pagination_str');
  }
}

async function runFavorites() {
  try {
    const res = await postService.getFavorites(pagination.value.limit, 1);
    posts.value = res.products || [];
    pagination.value = res.pagination || { ...DEFAULT_PAGINATION };
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
  }
}

function buildAdvancedPayload(): AdvancedSearchPayload {
  const current = filters.value;
  const payload: AdvancedSearchPayload = {
    page: 1,
    limit: pagination.value.limit || SEARCH_FALLBACK_PAGINATION.limit,
    sortBy: 'relevance'
  };
  if (queryLocal.value) payload.query = queryLocal.value;
  if (current.type) payload.type = current.type;
  // Le `<select>` d'état renvoie une seule valeur : seul un tableau était
  // pris en compte, le filtre d'état n'était donc jamais appliqué.
  const conditions = typeof current.conditions === 'string' ? [current.conditions] : current.conditions;
  if (conditions?.length) payload.condition = conditions;
  // Groupe du catalogue : filtre par identifiant (le nom ne retrouve pas les
  // annonces qui stockent l'identifiant). Le membre suit le même critère.
  if (current.groupId) {
    payload.group = current.groupId;
    if (current.member) payload.member = current.member;
  } else {
    if (current.group) payload.groups = [current.group];
    if (current.member) payload.members = [current.member];
  }
  if (current.albumId) payload.album = current.albumId;
  if (current.isOfficial) payload.isOfficial = true;
  if (current.version) payload.version = current.version;
  const min = current.min !== null && current.min !== undefined ? Number(current.min) : undefined;
  const max = current.max !== null && current.max !== undefined ? Number(current.max) : undefined;
  if (min !== undefined || max !== undefined) {
    payload.priceRange = { ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  }
  return payload;
}

async function runSearch() {
  try {
    const result = await searchService.advancedSearch(buildAdvancedPayload());
    posts.value = result.products || [];
    pagination.value = result.pagination || { ...SEARCH_FALLBACK_PAGINATION };
  } catch (error) {
    console.error('Erreur lors de la recherche avancée :', error);
    postService.search(queryLocal.value, filters.value.max, filters.value.min, filters.value.type)
      .then((res) => { posts.value = res.products; pagination.value = res.pagination; })
      .catch((e) => console.error('Erreur fallback :', e));
  }
}

async function loadMoreResults() {
  try {
    pagination.value.page++;
    const payload = buildAdvancedPayload();
    payload.page = pagination.value.page;
    const result = await searchService.advancedSearch(payload);
    posts.value.push(...(result.products || []));
    pagination.value.pages = result.pagination?.pages || pagination.value.pages;
  } catch (error) {
    console.error('Erreur chargement supplémentaire:', error);
    pagination.value.page--;
  }
}

/**
 * Critères transmis par l'URL (« Lancer » une recherche sauvegardée). Un texte
 * seul (`?q=`, saisi dans la barre de cette page) garde les filtres déjà
 * choisis dans le panneau : ils ne sont remplacés que si l'URL en porte.
 */
function applyCriteriaFromUrl() {
  const fromUrl = criteriaFromRouteQuery(route.query);
  if (!fromUrl) return;
  if (fromUrl.query) queryLocal.value = fromUrl.query;
  const filterQuery = { ...route.query };
  delete filterQuery.q;
  if (!criteriaFromRouteQuery(filterQuery)) return;
  filters.value = fromUrl.filters;
  urlFilters.value = fromUrl.filters;
}

function loadSearchInformation() {
  queryLocal.value = page.value.query;
  applyCriteriaFromUrl();
  const { event } = page.value;
  if (event === 'morePage') {
    // On restaure les articles déjà chargés (transmis via sessionStorage
    // par la grille). Fallback : recherche complète si rien à restaurer.
    if (!seedFromSession()) runSearch();
  } else if (event === 'morePageFavorites' || event === 'moreFavorites') {
    if (!seedFromSession()) runFavorites();
  } else {
    runSearch();
  }
}

async function saveCurrentSearch() {
  const criteria = criteriaFromPayload(buildAdvancedPayload());
  // Le groupe du catalogue est enregistré par identifiant : son nom ne sert qu'au libellé.
  const { groupId, group } = filters.value;
  const labels = groupId && group ? { [groupId]: group } : {};
  if (!hasCriteria(criteria)) {
    func.showToastInfo('Ajoutez un texte ou un filtre avant de sauvegarder la recherche');
    return;
  }
  savingSearch.value = true;
  try {
    await savedSearchService.create({ name: defaultSavedSearchName(criteria, labels), criteria });
    func.showToastSuccess('Recherche sauvegardée : retrouvez-la dans « Recherches sauvegardées »');
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Impossible de sauvegarder la recherche'));
  } finally {
    savingSearch.value = false;
  }
}

function applyFilter(valFilters: SearchFilters) {
  filters.value = valFilters;
  runSearch();
}

/** Un nouveau texte passe par l'URL (partageable, bouton Précédent) ; la recherche suit le changement de route. */
function searchEvent(query: string) {
  if (query === queryLocal.value) {
    runSearch();
    return;
  }
  router.push(searchRoute({ q: query }));
}

function handleResize() {
  isMobile.value = window.innerWidth <= MOBILE_MAX_WIDTH;
}

loadSearchInformation();
// La page reste montée quand seule l'URL change (nouvelle recherche, lien
// « Rechercher » de la barre de navigation) : on recharge alors les résultats.
watch(() => route.fullPath, loadSearchInformation);
onMounted(() => window.addEventListener('resize', handleResize));
onBeforeUnmount(() => window.removeEventListener('resize', handleResize));
</script>

<style scoped lang="scss">
@use '../../css/searchList.scss' as *;

.spacer {
  width: 2%;

  &--end { width: 5%; }
}

.title_content {
  margin-left: 24px;
}

.loading-indicator {
  height: 50px;
}

.save-search-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: var(--space-md);
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  &:hover:not(:disabled) {
    border-color: var(--accent-pink);
    color: var(--accent-pink);
  }
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
.load-more-btn {
  padding: 12px 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  &:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
  }
}
</style>
