<template>
  <div class="filter_mobile">
    <button type="button" class="filter-toggle-btn" :aria-expanded="filterMobileOpen" @click="toggleMobilePanel">
      <i class="bi bi-sliders" aria-hidden="true"></i>
      <span>Filtres</span>
    </button>
  </div>
  <div class="filter-panel" :class="{ show: filterMobileOpen }" @keydown.esc="closeMobilePanel">
    <div class="filter-panel__header">
      <h3 class="filter-panel__title">
        <i class="bi bi-sliders" aria-hidden="true"></i> Filtres
      </h3>
      <button type="button" class="filter-panel__close" aria-label="Fermer les filtres" @click="toggleMobilePanel">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label" for="filter-group">Groupe K-pop</label>
      <div class="filter-panel__autocomplete">
        <input
          id="filter-group"
          v-model="groupSearchInput"
          type="text"
          class="filter-panel__input"
          placeholder="Rechercher un groupe..."
          @input="searchGroupsDebounced"
        />
        <ul v-if="groupSuggestions.length" class="filter-panel__suggestions">
          <li v-for="g in groupSuggestions" :key="g._id">
            <button type="button" @click="selectGroup(g)">{{ g.name }}</button>
          </li>
        </ul>
      </div>
      <div v-if="tabFilter.group" class="filter-panel__tag">
        {{ tabFilter.group }}
        <button type="button" class="filter-panel__tag-remove" aria-label="Retirer le groupe" @click="clearGroup">
          <i class="bi bi-x" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label" for="filter-member">Membre</label>
      <select v-if="groupMembers.length" id="filter-member" v-model="tabFilter.member" class="filter-panel__select">
        <option :value="null">Tous les membres</option>
        <option v-for="member in groupMembers" :key="member" :value="member">{{ member }}</option>
      </select>
      <input
        v-else
        id="filter-member"
        v-model="tabFilter.member"
        type="text"
        class="filter-panel__input"
        placeholder="Nom du membre..."
      />
    </div>

    <div v-if="groupAlbums.length" class="filter-panel__section">
      <label class="filter-panel__label" for="filter-album">Album</label>
      <select id="filter-album" v-model="tabFilter.albumId" class="filter-panel__select">
        <option :value="null">Tous les albums</option>
        <option v-for="album in groupAlbums" :key="album._id" :value="album._id">{{ album.name }}</option>
      </select>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__check">
        <input v-model="tabFilter.isOfficial" type="checkbox" />
        <span>Articles officiels uniquement</span>
      </label>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label" for="filter-condition">État</label>
      <!-- `:value="null"` : `value="null"` envoyait la chaîne « null » comme critère. -->
      <select id="filter-condition" v-model="tabFilter.conditions" class="filter-panel__select" data-test="filter-condition">
        <option :value="null">Tous les états</option>
        <option value="new">Neuf</option>
        <option value="likeNew">Comme neuf</option>
        <option value="good">Bon état</option>
        <option value="fair">État moyen</option>
        <option value="poor">Mauvais état</option>
      </select>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label" for="filter-type">Type</label>
      <select id="filter-type" v-model="tabFilter.type" class="filter-panel__select" data-test="filter-type">
        <option :value="null">Tous les types</option>
        <option value="photocard">Photocard</option>
        <option value="album">Album</option>
        <option value="merch">Merch</option>
        <option value="other">Autre</option>
      </select>
    </div>

    <div class="filter-panel__section">
      <!-- Pas de <label> : le curseur porte ses propres libellés (min / max). -->
      <span class="filter-panel__label">Prix</span>
      <slider_price
        :key="sliderKey"
        :initial-min="tabFilter.min"
        :initial-max="tabFilter.max"
        @change-min-price="onChangeMinPrice"
        @change-max-price="onChangeMaxPrice"
      ></slider_price>
    </div>

    <div class="filter-panel__actions">
      <button type="button" class="filter-panel__btn filter-panel__btn--ghost" @click="resetFilters">
        <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Réinitialiser
      </button>
      <button type="button" class="filter-panel__btn filter-panel__btn--primary" @click="saveFilter">
        <i class="bi bi-check-lg" aria-hidden="true"></i> Appliquer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import slider_price from "../components/slider_price.vue";
import groupService, { type KpopGroup } from '@/services/group.service';
import type { KpopAlbum } from '@/services/album.service';
import type { UrlSearchCriteria } from '@/utils/savedSearch';

/** Filtres vides : `group` garde le nom affiché, `groupId` / `albumId` filtrent côté API. */
const emptyFilters = () => ({
  min: 0,
  // `null` : pas de prix maximum (le curseur est en bout de piste).
  max: null as number | null,
  conditions: null as string | null,
  type: null as string | null,
  group: null as string | null,
  groupId: null as string | null,
  member: null as string | null,
  albumId: null as string | null,
  isOfficial: false,
});

export type PanelFilters = ReturnType<typeof emptyFilters>;

/** Largeur sous laquelle le panneau s'ouvre en plein écran (cf. media query du style). */
const MOBILE_MAX_WIDTH = 769;
const GROUP_SEARCH_MIN_LENGTH = 2;
const GROUP_SEARCH_DEBOUNCE_MS = 250;

const props = withDefaults(defineProps<{
  /** Critères déjà appliqués par la page (rejoués depuis l'URL) : le panneau les affiche. */
  initialFilters?: UrlSearchCriteria['filters'] | null
}>(), { initialFilters: null });

const emit = defineEmits<{ saveFilter: [filters: PanelFilters] }>();

const tabFilter = ref(emptyFilters());
const filterMobileOpen = ref(false);
const groupSearchInput = ref('');
const groupSuggestions = ref<KpopGroup[]>([]);
const groupMembers = ref<string[]>([]);
const groupAlbums = ref<KpopAlbum[]>([]);
/** Remonte le curseur de prix, qui ne lit sa fourchette qu'au montage. */
const sliderKey = ref(0);
let groupTimer: ReturnType<typeof setTimeout> | undefined = undefined;

/** Membres et albums du groupe choisi ; rend son nom, ou `null` si le détail est indisponible. */
async function loadGroupCatalog(groupId: string): Promise<string | null> {
  try {
    const detail = await groupService.getGroupDetail(groupId);
    groupMembers.value = detail.group.members ?? [];
    groupAlbums.value = detail.albums;
    return detail.group.name;
  } catch {
    // Sans le détail, le membre reste en saisie libre et l'album non filtrable.
    groupMembers.value = [];
    groupAlbums.value = [];
    return null;
  }
}

async function applyInitialFilters(initial: UrlSearchCriteria['filters'] | null) {
  if (!initial) return;
  tabFilter.value = {
    min: initial.min ?? 0,
    max: initial.max ?? null,
    // Le sélecteur d'état n'affiche qu'une valeur.
    conditions: initial.conditions?.[0] ?? null,
    type: initial.type,
    group: initial.group,
    groupId: initial.groupId,
    member: initial.member,
    albumId: initial.albumId,
    isOfficial: initial.isOfficial,
  };
  groupSearchInput.value = initial.group ?? '';
  sliderKey.value++;
  if (initial.groupId) {
    // L'URL ne porte que l'identifiant : le nom affiché vient du catalogue.
    const name = await loadGroupCatalog(initial.groupId);
    if (name && !tabFilter.value.group) {
      tabFilter.value.group = name;
      groupSearchInput.value = name;
    }
  }
}
watch(() => props.initialFilters, applyInitialFilters, { immediate: true });

function onChangeMinPrice(val: number) {
  tabFilter.value.min = val;
}
function onChangeMaxPrice(val: number | null) {
  tabFilter.value.max = val;
}
function clearGroup() {
  tabFilter.value = { ...tabFilter.value, group: null, groupId: null, member: null, albumId: null };
  groupSearchInput.value = '';
  groupMembers.value = [];
  groupAlbums.value = [];
}
function resetFilters() {
  clearGroup();
  tabFilter.value = emptyFilters();
  groupSuggestions.value = [];
  sliderKey.value++;
}
function searchGroupsDebounced() {
  clearTimeout(groupTimer);
  groupTimer = setTimeout(async () => {
    if (groupSearchInput.value.trim().length >= GROUP_SEARCH_MIN_LENGTH) {
      try {
        groupSuggestions.value = await groupService.searchGroups(groupSearchInput.value);
      } catch { groupSuggestions.value = []; }
    } else {
      groupSuggestions.value = [];
    }
  }, GROUP_SEARCH_DEBOUNCE_MS);
}
/** Le groupe choisi propose ses membres et albums du catalogue. */
async function selectGroup(group: KpopGroup) {
  tabFilter.value = { ...tabFilter.value, group: group.name, groupId: group._id, member: null, albumId: null };
  groupSearchInput.value = group.name;
  groupSuggestions.value = [];
  await loadGroupCatalog(group._id);
}

/** En plein écran sur mobile : la page derrière ne doit plus défiler. */
function setMobilePanelOpen(open: boolean) {
  filterMobileOpen.value = open;
  document.body.style.overflow = open ? 'hidden' : '';
}

function toggleMobilePanel() {
  setMobilePanelOpen(!filterMobileOpen.value);
}

function closeMobilePanel() {
  if (filterMobileOpen.value) setMobilePanelOpen(false);
}

function saveFilter() {
  // Une copie : la page garderait sinon une référence que le panneau modifie
  // avant même que l'utilisateur clique de nouveau sur « Appliquer ».
  emit('saveFilter', { ...tabFilter.value });
  if (window.innerWidth <= MOBILE_MAX_WIDTH) {
    toggleMobilePanel();
  }
}

// Quitter la page panneau ouvert ne doit pas laisser le défilement bloqué.
onBeforeUnmount(() => {
  clearTimeout(groupTimer);
  closeMobilePanel();
});
</script>

<style lang="scss" scoped>
.filter-panel {
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  position: sticky;
  top: 20px;
  z-index: 10;
  height: fit-content;
}

.filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-panel__title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-primary);

  i { color: var(--accent-pink); }
}

.filter-panel__close {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);

  &:hover { background: var(--surface-hover); }
}

.filter-panel__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.filter-panel__label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-panel__select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  appearance: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236c757d' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;

  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: var(--focus-ring);
  }
}

.filter-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--surface-border);
}

.filter-panel__input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: var(--focus-ring);
  }
}

.filter-panel__autocomplete {
  position: relative;
}

.filter-panel__check {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.filter-panel__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  max-height: 160px;
  overflow-y: auto;
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 4px 0 0;

  button {
    display: block;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--text-primary);

    &:hover,
    &:focus-visible {
      background: var(--surface-hover);
    }
  }
}

.filter-panel__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  padding: 4px 10px;
  background: var(--accent-pink);
  color: var(--text-on-accent);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.filter-panel__tag-remove {
  background: none;
  border: none;
  color: var(--text-on-accent);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.filter-panel__btn {
  flex: 1 1 120px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  transition: all var(--transition-fast);
  border: none;

  &--primary {
    background: var(--accent-gradient);
    color: var(--text-on-accent);
    box-shadow: var(--shadow-accent-sm);

    &:hover {
      box-shadow: var(--shadow-accent-md);
      transform: translateY(-1px);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--surface-border);

    &:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }
  }
}

// Mobile toggle button
.filter_mobile {
  display: none;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--accent-pink);
    color: var(--accent-pink);
  }
}

@media (max-width: 769px) {
  .filter_mobile {
    display: block;
  }

  .filter-panel {
    display: none;
    position: fixed;
    inset: 0;
    z-index: var(--z-dropdown);
    max-width: 100%;
    border-radius: 0;
    overflow-y: auto;
    padding: var(--space-xl);

    &.show {
      display: flex;
    }
  }

  .filter-panel__close {
    display: flex;
  }
}
</style>
