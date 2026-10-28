<template>
  <div class="address-autocomplete">
    <input
      :id="inputId"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="listOpen"
      :aria-controls="listId"
      :aria-activedescendant="activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :value="modelValue"
      :placeholder="placeholder"
      autocomplete="off"
      @input="onInput"
      @focus="showResults = results.length > 0"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <ul v-if="listOpen" :id="listId" class="results" role="listbox">
      <li
        v-for="(r, index) in results"
        :id="optionId(index)"
        :key="r.label"
        role="option"
        :aria-selected="index === activeIndex"
        :class="{ active: index === activeIndex }"
        @mousedown.prevent="select(r)"
      >
        <span class="line1">{{ r.streetLine1 || r.label }}</span>
        <span class="meta">{{ r.postalCode }} {{ r.city }}</span>
      </li>
    </ul>
    <div v-if="loading" class="loading" role="status">Recherche…</div>
  </div>
</template>

<script setup lang="ts">
/** Champ de rue avec suggestions d'adresses (combobox accessible au clavier). */
import { computed, onBeforeUnmount, ref, useId } from 'vue';
import addressService, { type AddressResult } from '@/services/address.service';

withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  /** Pour relier un <label for> au champ, qui n'est pas la racine du composant. */
  inputId?: string;
}>(), {
  placeholder: 'Numéro et nom de rue',
  inputId: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [result: AddressResult];
}>();

const results = ref<AddressResult[]>([]);
const loading = ref(false);
const showResults = ref(false);
const activeIndex = ref(-1);
const listId = `address-results-${useId()}`;
const optionId = (index: number) => `${listId}-${index}`;
const listOpen = computed(() => showResults.value && results.value.length > 0);
let debounceId: ReturnType<typeof setTimeout> | null = null;

async function fetchResults(q: string) {
  if (q.trim().length < 3) {
    results.value = [];
    return;
  }
  loading.value = true;
  try {
    results.value = await addressService.lookup({ q, limit: 8 });
    showResults.value = results.value.length > 0;
    activeIndex.value = -1;
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', value);
  if (debounceId) clearTimeout(debounceId);
  debounceId = setTimeout(() => fetchResults(value), 250);
}

function onBlur() {
  // Léger délai pour permettre au mousedown du <li> de se déclencher
  setTimeout(() => { showResults.value = false; }, 150);
}

function select(r: AddressResult) {
  emit('update:modelValue', r.streetLine1);
  emit('select', r);
  showResults.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (!listOpen.value) return;
  const count = results.value.length;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    activeIndex.value = (activeIndex.value + step + count) % count;
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault();
    select(results.value[activeIndex.value]);
  } else if (event.key === 'Escape') {
    // Échap ferme d'abord la liste, sans remonter jusqu'à la modale qui contient le champ.
    event.stopPropagation();
    showResults.value = false;
  }
}

onBeforeUnmount(() => {
  if (debounceId) clearTimeout(debounceId);
});
</script>

<style scoped>
.address-autocomplete {
  position: relative;
}
.address-autocomplete input {
  width: 100%;
}
.results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xs);
  margin: 0;
  padding: 0;
  list-style: none;
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
}
.results li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--surface-border);
}
.results li:last-child {
  border-bottom: none;
}
.results li:hover,
.results li.active {
  background: var(--surface-hover);
}
.results .line1 {
  font-weight: 500;
}
.results .meta {
  font-size: 0.85em;
  color: var(--text-secondary);
}
.loading {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 0.85em;
  color: var(--text-muted);
  padding: 4px 8px;
}
</style>
