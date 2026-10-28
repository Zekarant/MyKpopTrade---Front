<template>
  <div class="select-searchable">
    <input
      :id="id"
      v-model="query"
      type="text"
      class="searchable-input"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      :aria-activedescendant="highlighted >= 0 ? optionId(highlighted) : undefined"
      :placeholder="placeholder"
      :disabled="disabled"
      @focus="isOpen = true"
      @blur="closeSoon"
      @input="isOpen = true"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.enter="selectHighlighted"
      @keydown.esc="isOpen = false"
    />
    <i v-if="selected" class="bi bi-check-circle searchable-check"></i>
    <div v-if="isOpen && !disabled" :id="listId" class="dropdown-menu" role="listbox">
      <div
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option._id"
        role="option"
        :aria-selected="index === highlighted"
        class="dropdown-item"
        :class="{ 'dropdown-item--highlighted': index === highlighted }"
        @mousedown="select(option)"
      >
        {{ option.name }}
      </div>
      <div v-if="options.length === 0" class="dropdown-item disabled">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { _id: string; name: string }">
/**
 * Champ de recherche à liste déroulante (groupe, album) : la souris choisit au
 * `mousedown`, avant que le `blur` du champ ne ferme la liste ; le clavier
 * parcourt la liste avec les flèches, choisit avec Entrée, ferme avec Échap.
 */
import { ref, useId, watch } from 'vue';

const props = defineProps<{
  id: string;
  options: T[];
  /** Une valeur du catalogue est retenue : coche verte dans le champ. */
  selected: boolean;
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ select: [option: T] }>();

const query = defineModel<string>({ required: true });

/** Délai avant fermeture au `blur` : laisse passer un clic en cours sur la liste. */
const BLUR_CLOSE_DELAY_MS = 150;

const isOpen = ref(false);
const highlighted = ref(-1);
const listId = `catalog-options-${useId()}`;
const optionId = (index: number) => `${listId}-${index}`;

watch(() => props.options, () => { highlighted.value = -1; });

function closeSoon() {
  setTimeout(() => { isOpen.value = false; }, BLUR_CLOSE_DELAY_MS);
}

function moveHighlight(step: number) {
  isOpen.value = true;
  const last = props.options.length - 1;
  highlighted.value = Math.min(Math.max(highlighted.value + step, 0), last);
}

function select(option: T) {
  emit('select', option);
  isOpen.value = false;
}

function selectHighlighted(event: KeyboardEvent) {
  const option = isOpen.value ? props.options[highlighted.value] : undefined;
  if (!option) return;
  // Sans cela, Entrée soumettrait aussi le formulaire de l'annonce.
  event.preventDefault();
  select(option);
}
</script>
