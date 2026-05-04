<template>
  <div class="address-autocomplete">
    <input
      type="text"
      :value="modelValue"
      @input="onInput"
      @focus="showResults = results.length > 0"
      @blur="onBlur"
      :placeholder="placeholder"
      autocomplete="off"
    />
    <ul v-if="showResults && results.length > 0" class="results">
      <li
        v-for="r in results"
        :key="r.label"
        @mousedown.prevent="select(r)"
      >
        <span class="line1">{{ r.streetLine1 || r.label }}</span>
        <span class="meta">{{ r.postalCode }} {{ r.city }}</span>
      </li>
    </ul>
    <div v-if="loading" class="loading">Recherche…</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType } from 'vue';
import addressService, { type AddressResult } from '@/services/address.service';

export default defineComponent({
  name: 'AddressAutocomplete',
  props: {
    modelValue: { type: String, required: true },
    placeholder: { type: String, default: 'Numéro et nom de rue' }
  },
  emits: ['update:modelValue', 'select'],
  setup(props, { emit }) {
    const results = ref<AddressResult[]>([]);
    const loading = ref(false);
    const showResults = ref(false);
    let debounceId: ReturnType<typeof setTimeout> | null = null;

    const fetchResults = async (q: string) => {
      if (q.trim().length < 3) {
        results.value = [];
        return;
      }
      loading.value = true;
      try {
        results.value = await addressService.lookup({ q, limit: 8 });
        showResults.value = results.value.length > 0;
      } catch (err) {
        results.value = [];
      } finally {
        loading.value = false;
      }
    };

    const onInput = (event: Event) => {
      const value = (event.target as HTMLInputElement).value;
      emit('update:modelValue', value);
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => fetchResults(value), 250);
    };

    const onBlur = () => {
      // Léger délai pour permettre au mousedown du <li> de se déclencher
      setTimeout(() => { showResults.value = false; }, 150);
    };

    const select = (r: AddressResult) => {
      emit('update:modelValue', r.streetLine1);
      emit('select', r);
      showResults.value = false;
    };

    return { results, loading, showResults, onInput, onBlur, select };
  }
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
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.results li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #f0f0f0;
}
.results li:last-child {
  border-bottom: none;
}
.results li:hover {
  background: #f7f7f7;
}
.results .line1 {
  font-weight: 500;
}
.results .meta {
  font-size: 0.85em;
  color: #666;
}
.loading {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 0.85em;
  color: #888;
  padding: 4px 8px;
}
</style>
