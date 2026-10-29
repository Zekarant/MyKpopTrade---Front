<template>
<div ref="wrapper" class="search-bar-wrapper">
  <span class="search-icon" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
    </svg>
  </span>
  <input
    v-model="searchQuery"
    type="text"
    class="search-input"
    placeholder="Rechercher un produit ..."
    aria-label="Rechercher un produit"
    @input="onInput"
    @keyup.enter="search"
    @focus="onFocus"
    @keydown.down.prevent="moveCursor(1)"
    @keydown.up.prevent="moveCursor(-1)"
    @keydown.escape="closeDropdown"
  >
  <button v-if="searchQuery != ''" type="button" class="clear-button" aria-label="Effacer la recherche" @click="clearSearch">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
  </button>

  <!-- Dropdown suggestions / history -->
  <div v-if="dropdownOpen && (suggestions.length || history.length)" class="search-dropdown">
    <div v-if="suggestions.length" class="search-dropdown__section">
      <div class="search-dropdown__title">Suggestions</div>
      <button
        v-for="(label, i) in suggestions"
        :key="`sugg-${i}-${label}`"
        type="button"
        :class="['search-dropdown__item', { 'search-dropdown__item--active': cursor === i }]"
        @click="pick(label)"
      >
        <i class="bi bi-search" aria-hidden="true"></i>
        <span>{{ label }}</span>
      </button>
    </div>

    <div v-if="history.length" class="search-dropdown__section">
      <div class="search-dropdown__title">
        Recherches récentes
        <button type="button" class="search-dropdown__clear" @click.stop="clearAllHistory">Tout effacer</button>
      </div>
      <!-- Deux actions par ligne (relancer, supprimer) : deux boutons voisins
           plutôt qu'un bouton imbriqué dans une ligne cliquable. -->
      <div
        v-for="(entry, i) in history"
        :key="entry._id"
        :class="['search-dropdown__item', { 'search-dropdown__item--active': cursor === suggestions.length + i }]"
      >
        <button type="button" class="search-dropdown__pick" @click="pick(entry.query)">
          <i class="bi bi-clock-history" aria-hidden="true"></i>
          <span class="search-dropdown__item-text">{{ entry.query }}</span>
        </button>
        <button type="button" class="search-dropdown__remove" :aria-label="`Supprimer « ${entry.query} » de l'historique`" @click.stop="removeHistory(entry)">
          <i class="bi bi-x" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import searchService, { type SearchHistoryEntry, type SearchSuggestions } from '@/services/search.service';
import { hasSession } from '@/services/session.cookies';

/** Élément de suggestion quand l'API renvoie déjà une liste plutôt que des catégories. */
type RawSuggestion = string | { label?: string | { name?: string }; name?: string };

const SUGGESTIONS_MIN_LENGTH = 2;
const MAX_SUGGESTIONS = 8;
const MAX_HISTORY = 5;
const SUGGESTIONS_DEBOUNCE_MS = 250;

const props = withDefaults(defineProps<{ query?: string }>(), { query: '' });
const emit = defineEmits<{ search: [query: string] }>();

const wrapper = ref<HTMLElement | null>(null);
const searchQuery = ref(props.query);
const suggestions = ref<string[]>([]);
const history = ref<SearchHistoryEntry[]>([]);
const dropdownOpen = ref(false);
const cursor = ref(-1);
let debounceHandle: ReturnType<typeof setTimeout> | null = null;

function labelOf(item: RawSuggestion): string {
  if (typeof item === 'string') return item;
  const label = item.label;
  return (typeof label === 'string' ? label : label?.name) || item.name || '';
}

/** Groupes, albums puis membres, aplatis en libellés à proposer. */
function suggestionLabels(raw: SearchSuggestions | RawSuggestion[]): string[] {
  if (Array.isArray(raw)) return raw.map(labelOf);
  return [
    ...(Array.isArray(raw.groups) ? raw.groups : []),
    ...(Array.isArray(raw.albums) ? raw.albums : []),
    ...(Array.isArray(raw.members) ? raw.members : [])
  ].map((item) => labelOf(item as RawSuggestion));
}

function closeDropdown() {
  dropdownOpen.value = false;
  cursor.value = -1;
}

function search() {
  closeDropdown();
  emit('search', searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  search();
}

function pick(query: string) {
  searchQuery.value = query;
  search();
}

async function fetchHistory() {
  if (!hasSession()) {
    history.value = [];
    return;
  }
  try {
    const res = await searchService.getHistory();
    history.value = (Array.isArray(res?.searchHistory) ? res.searchHistory : []).slice(0, MAX_HISTORY);
  } catch {
    history.value = [];
  }
}

async function fetchSuggestions() {
  if (!searchQuery.value || searchQuery.value.length < SUGGESTIONS_MIN_LENGTH) {
    suggestions.value = [];
    await fetchHistory();
    dropdownOpen.value = !!history.value.length;
    return;
  }
  try {
    const res = await searchService.getSuggestions(searchQuery.value);
    suggestions.value = (res?.suggestions ? suggestionLabels(res.suggestions) : []).slice(0, MAX_SUGGESTIONS);
    await fetchHistory();
    dropdownOpen.value = suggestions.value.length > 0 || history.value.length > 0;
  } catch {
    suggestions.value = [];
  }
}

function onInput() {
  cursor.value = -1;
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(fetchSuggestions, SUGGESTIONS_DEBOUNCE_MS);
}

async function onFocus() {
  dropdownOpen.value = true;
  if (searchQuery.value && searchQuery.value.length >= SUGGESTIONS_MIN_LENGTH) {
    await fetchSuggestions();
  } else {
    await fetchHistory();
  }
}

// Échec silencieux : l'historique n'est qu'un raccourci, la recherche reste possible.
async function removeHistory(entry: SearchHistoryEntry) {
  try {
    await searchService.deleteHistoryItem(entry._id);
    history.value = history.value.filter((x) => x._id !== entry._id);
  } catch {
    /* l'entrée reste affichée */
  }
}

async function clearAllHistory() {
  try {
    await searchService.clearHistory();
    history.value = [];
  } catch {
    /* l'historique reste affiché */
  }
}

function moveCursor(delta: number) {
  const max = suggestions.value.length + history.value.length - 1;
  if (max < 0) return;
  cursor.value = Math.min(Math.max(cursor.value + delta, 0), max);
}

// Les flèches pré-remplissent le champ avec l'élément survolé.
watch(cursor, (index) => {
  if (index < 0) return;
  const suggestionCount = suggestions.value.length;
  if (index < suggestionCount) {
    searchQuery.value = suggestions.value[index];
  } else {
    const entry = history.value[index - suggestionCount];
    if (entry) searchQuery.value = entry.query;
  }
});

// Un clic hors de la barre ferme les suggestions ; l'écouteur est retiré au démontage.
onClickOutside(wrapper, closeDropdown);

// La page peut changer de recherche sans remonter la barre (lien « Rechercher », bouton Précédent).
watch(() => props.query, (query) => {
  searchQuery.value = query;
});

onBeforeUnmount(() => {
  if (debounceHandle) clearTimeout(debounceHandle);
});
</script>

<style lang="scss" scoped>
.search-bar-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 12px 12px;
  max-width: 990px;
  height: 48px;
  justify-self: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
  position: relative;

  // Le champ n'a ni bordure ni contour : c'est le cadre qui montre le focus.
  &:focus-within {
    outline: 2px solid var(--accent-pink);
    outline-offset: 2px;
  }
}

.search-icon {
  color: var(--text-secondary);
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: var(--text-primary);
}

.clear-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
  margin-left: 8px;
  display: flex;
  align-items: center;

  &:hover { color: var(--text-primary); }
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  max-height: 360px;
  overflow-y: auto;
}

.search-dropdown__section + .search-dropdown__section {
  border-top: 1px solid var(--surface-border);
}

.search-dropdown__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.search-dropdown__clear {
  background: none;
  border: none;
  color: var(--accent-pink);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  &:hover { text-decoration: underline; }
}

.search-dropdown__item,
.search-dropdown__pick {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  i { color: var(--text-muted); flex-shrink: 0; }

  span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.search-dropdown__item {
  padding: 10px 14px;

  &:hover, &--active { background: var(--surface-hover); }
}

.search-dropdown__pick {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.search-dropdown__item-text { flex: 1; }

.search-dropdown__remove {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  &:hover { background: var(--surface-border); color: var(--text-primary); }
}
</style>
