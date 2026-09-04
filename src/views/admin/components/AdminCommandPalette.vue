<template>
  <div class="admin__palette-overlay" @click.self="$emit('close')">
    <div class="admin__palette" role="dialog" aria-modal="true" aria-label="Recherche globale">
      <div class="admin__palette-input">
        <i class="bi bi-search"></i>
        <input
          ref="input"
          v-model="query"
          type="text"
          placeholder="Rechercher un membre, une annonce, une publication, ou aller à une section…"
          aria-label="Recherche"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="activate(entries[cursor])"
          @keydown.esc="$emit('close')"
        />
        <kbd class="admin__kbd">Échap</kbd>
      </div>

      <div v-if="entries.length === 0" class="admin__empty admin__empty--inline">
        <i class="bi bi-search"></i>
        <p>{{ emptyMessage }}</p>
      </div>

      <ul v-else class="admin__palette-results">
        <li
          v-for="(entry, index) in entries"
          :key="`${entry.group}-${entry.id}`"
          class="admin__palette-item"
          :class="{ 'admin__palette-item--active': index === cursor }"
          @mouseenter="cursor = index"
          @click="activate(entry)"
        >
          <span class="admin__palette-icon"><i :class="entry.icon"></i></span>
          <span class="admin__palette-body">
            <span class="admin__palette-label">{{ entry.label }}</span>
            <span class="admin__palette-detail">{{ entry.detail }}</span>
          </span>
          <span class="admin__badge">{{ entry.group }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref, watch } from 'vue';
  import adminService from '@/services/admin.service';
  import { ADMIN_NAV } from '../adminSections';

  const SEARCH_DEBOUNCE_MS = 250;
  const MIN_QUERY_LENGTH = 2;

  const KIND_ICONS: Record<string, string> = {
    user: 'bi bi-person',
    product: 'bi bi-box-seam',
    post: 'bi bi-chat-left-text'
  };

  const KIND_GROUPS: Record<string, string> = {
    user: 'Membre',
    product: 'Annonce',
    post: 'Publication'
  };

  interface PaletteEntry {
    group: string;
    id: string;
    icon: string;
    label: string;
    detail: string;
    tab: string;
    search?: string;
  }

  export default defineComponent({
    name: 'AdminCommandPalette',
    emits: ['close', 'navigate'],
    setup(_props, { emit }) {
      const query = ref('');
      const input = ref<HTMLInputElement | null>(null);
      const results = ref<PaletteEntry[]>([]);
      const cursor = ref(0);
      const searching = ref(false);

      const sectionEntries = computed<PaletteEntry[]>(() =>
        ADMIN_NAV.flatMap((group) => group.items).map((item) => ({
          group: 'Section',
          id: item.id,
          icon: item.icon,
          label: item.label,
          detail: item.subtitle,
          tab: item.id
        }))
      );

      const entries = computed<PaletteEntry[]>(() => {
        const term = query.value.trim().toLowerCase();
        if (term.length < MIN_QUERY_LENGTH) return sectionEntries.value;

        const matchingSections = sectionEntries.value.filter(
          (entry) => entry.label.toLowerCase().includes(term) || entry.tab.includes(term)
        );
        return [...matchingSections, ...results.value];
      });

      const emptyMessage = computed(() => {
        if (query.value.trim().length < MIN_QUERY_LENGTH) return 'Saisissez au moins deux caractères.';
        return searching.value ? 'Recherche…' : 'Aucun résultat.';
      });

      const move = (delta: number) => {
        const total = entries.value.length;
        if (total === 0) return;
        cursor.value = (cursor.value + delta + total) % total;
      };

      const activate = (entry?: PaletteEntry) => {
        if (!entry) return;
        emit('navigate', { tab: entry.tab, search: entry.search });
        emit('close');
      };

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      watch(query, (value) => {
        cursor.value = 0;
        if (debounceTimer) clearTimeout(debounceTimer);

        if (value.trim().length < MIN_QUERY_LENGTH) {
          results.value = [];
          searching.value = false;
          return;
        }

        searching.value = true;
        debounceTimer = setTimeout(async () => {
          try {
            const data = await adminService.globalSearch(value.trim());
            results.value = (data.results || []).map((result: any) => ({
              group: KIND_GROUPS[result.kind] || result.kind,
              id: result.id,
              icon: KIND_ICONS[result.kind] || 'bi bi-dot',
              label: result.label,
              detail: result.detail,
              tab: result.tab,
              search: result.search
            }));
          } catch {
            results.value = [];
          } finally {
            searching.value = false;
          }
        }, SEARCH_DEBOUNCE_MS);
      });

      onMounted(() => input.value?.focus());

      return { query, input, entries, cursor, emptyMessage, move, activate };
    }
  });
</script>
