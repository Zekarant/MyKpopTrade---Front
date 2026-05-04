<template>
<div class="search-bar-wrapper" @click.stop>
  <span class="search-icon">
    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
    </svg>
  </span>
  <input
    type="text"
    class="search-input"
    placeholder="Rechercher un produit ..."
    v-model="searchQuery"
    @input="onInput"
    @keyup.enter="search"
    @focus="onFocus"
    @keydown.down.prevent="moveCursor(1)"
    @keydown.up.prevent="moveCursor(-1)"
    @keydown.escape="closeDropdown"
  >
  <button v-if="searchQuery != ''" class="clear-button" @click="searchQuery = '';search()">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
  </button>

  <!-- Dropdown suggestions / history -->
  <div v-if="dropdownOpen && (suggestions.length || history.length)" class="search-dropdown">
    <div v-if="suggestions.length" class="search-dropdown__section">
      <div class="search-dropdown__title">Suggestions</div>
      <button
        v-for="(s, i) in suggestions"
        :key="'sugg-' + i"
        :class="['search-dropdown__item', { 'search-dropdown__item--active': cursor === i }]"
        @click="pickSuggestion(s)"
      >
        <i class="bi bi-search"></i>
        <span>{{ getSuggestionLabel(s) }}</span>
      </button>
    </div>

    <div v-if="history.length" class="search-dropdown__section">
      <div class="search-dropdown__title">
        Recherches récentes
        <button class="search-dropdown__clear" @click.stop="clearAllHistory">Tout effacer</button>
      </div>
      <div
        v-for="(h, i) in history"
        :key="'hist-' + i"
        :class="['search-dropdown__item', { 'search-dropdown__item--active': cursor === suggestions.length + i }]"
        @click="pickHistory(h)"
      >
        <i class="bi bi-clock-history"></i>
        <span class="search-dropdown__item-text">{{ h.query }}</span>
        <button class="search-dropdown__remove" @click.stop="removeHistory(h)" aria-label="Supprimer">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  </div>
</div>

</template>

<script lang="ts">
import searchService from '@/services/search.service';
import Cookies from 'js-cookie';

interface HistoryEntry {
  _id: string;
  query: string;
  lastSearched?: string;
  searchCount?: number;
}

export default {
  name: 'search_bar_2',
  props: {
    query: { type: String, default: '' },
    filters: {
      type: Object,
      default: () => ({ min: null, max: null, conditions: null, type: null }),
    },
  },
  data() {
    return {
      searchQuery: '',
      suggestions: [] as any[],
      history: [] as HistoryEntry[],
      dropdownOpen: false,
      cursor: -1,
      debounceHandle: null as ReturnType<typeof setTimeout> | null,
      onDocClick: null as ((e: MouseEvent) => void) | null,
    };
  },
  mounted() {
    if (this.query) this.searchQuery = this.query;
    this.onDocClick = () => this.closeDropdown();
    document.addEventListener('click', this.onDocClick);
  },
  beforeUnmount() {
    if (this.onDocClick) document.removeEventListener('click', this.onDocClick);
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
  },
  methods: {
    isAuthenticated(): boolean {
      return !!Cookies.get('sessionToken');
    },
    search() {
      this.closeDropdown();
      this.$emit('search', this.searchQuery);
    },
    onInput() {
      this.cursor = -1;
      if (this.debounceHandle) clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.fetchSuggestions(), 250);
    },
    async onFocus() {
      this.dropdownOpen = true;
      if (this.searchQuery && this.searchQuery.length >= 2) {
        await this.fetchSuggestions();
      } else {
        await this.fetchHistory();
      }
    },
    async fetchSuggestions() {
      if (!this.searchQuery || this.searchQuery.length < 2) {
        this.suggestions = [];
        if (this.isAuthenticated()) await this.fetchHistory();
        this.dropdownOpen = !!this.history.length;
        return;
      }
      try {
        const res = await searchService.getSuggestions(this.searchQuery);
        this.suggestions = (res?.suggestions ? this.flattenSuggestions(res.suggestions) : []).slice(0, 8);
        if (this.isAuthenticated()) await this.fetchHistory();
        this.dropdownOpen = this.suggestions.length > 0 || this.history.length > 0;
      } catch {
        this.suggestions = [];
      }
    },
    flattenSuggestions(s: any): any[] {
      if (Array.isArray(s)) return s;
      const items: any[] = [];
      if (Array.isArray(s.groups)) for (const g of s.groups) items.push({ kind: 'group', label: g.name || g });
      if (Array.isArray(s.albums)) for (const a of s.albums) items.push({ kind: 'album', label: a.name || a });
      if (Array.isArray(s.members)) for (const m of s.members) items.push({ kind: 'member', label: m.name || m });
      return items;
    },
    getSuggestionLabel(s: any): string {
      return typeof s === 'string' ? s : (s.label || s.name || '');
    },
    async fetchHistory() {
      if (!this.isAuthenticated()) {
        this.history = [];
        return;
      }
      try {
        const res = await searchService.getHistory();
        this.history = (res?.data || res?.history || res || []).slice(0, 5);
      } catch {
        this.history = [];
      }
    },
    pickSuggestion(s: any) {
      this.searchQuery = this.getSuggestionLabel(s);
      this.search();
    },
    pickHistory(h: HistoryEntry) {
      this.searchQuery = h.query;
      this.search();
    },
    async removeHistory(h: HistoryEntry) {
      try {
        await searchService.deleteHistoryItem(h._id);
        this.history = this.history.filter((x) => x._id !== h._id);
      } catch (e) {
        // silent fail
      }
    },
    async clearAllHistory() {
      try {
        await searchService.clearHistory();
        this.history = [];
      } catch (e) {
        // silent fail
      }
    },
    closeDropdown() {
      this.dropdownOpen = false;
      this.cursor = -1;
    },
    moveCursor(delta: number) {
      const max = this.suggestions.length + this.history.length - 1;
      if (max < 0) return;
      this.cursor = Math.min(Math.max(this.cursor + delta, 0), max);
    },
  },
  watch: {
    cursor(val: number) {
      if (val < 0) return;
      const sCount = this.suggestions.length;
      if (val < sCount) {
        this.searchQuery = this.getSuggestionLabel(this.suggestions[val]);
      } else {
        const h = this.history[val - sCount];
        if (h) this.searchQuery = h.query;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.search-bar-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--light-color);
  border-radius: 8px;
  padding: 12px 12px;
  max-width: 990px;
  height: 48px;
  justify-self: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
  position: relative;
}

.search-icon {
  color: #6c757d;
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
  color: #121212;
}

.clear-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 18px;
  margin-left: 8px;
  display: flex;
  align-items: center;

  &:hover { color: #212529; }
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-card, white);
  border: 1px solid var(--surface-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
  max-height: 360px;
  overflow-y: auto;
}

.search-dropdown__section + .search-dropdown__section {
  border-top: 1px solid var(--surface-border, #eee);
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
  color: var(--text-muted, #888);
}

.search-dropdown__clear {
  background: none;
  border: none;
  color: var(--accent-pink, #ff2d78);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  &:hover { text-decoration: underline; }
}

.search-dropdown__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--text-primary, #222);
  font-size: 14px;

  &:hover, &--active { background: var(--surface-hover, #f5f5f5); }

  i { color: var(--text-muted, #888); flex-shrink: 0; }

  span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.search-dropdown__item-text { flex: 1; }

.search-dropdown__remove {
  background: none;
  border: none;
  color: var(--text-muted, #aaa);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  &:hover { background: var(--surface-border, #e0e0e0); color: var(--text-primary, #222); }
}
</style>
