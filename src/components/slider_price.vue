<script setup lang="ts">
/**
 * Fourchette de prix : deux curseurs natifs superposés + deux champs numériques.
 *
 * Remplace le Slider PrimeVue, qui imposait d'enregistrer PrimeVue et son thème
 * Aura dans main.ts (~100 kB dans le bundle initial) pour ce seul composant.
 * Les <input type="range"> natifs restent accessibles au clavier et aux
 * lecteurs d'écran sans dépendance.
 *
 * Contrat inchangé pour le parent : `changeMinPrice` / `changeMaxPrice`
 * émis avec un nombre à chaque modification.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{ min?: number; max?: number; step?: number }>(), {
  min: 0,
  max: 100,
  step: 1
})

const emit = defineEmits<{
  changeMinPrice: [value: number]
  changeMaxPrice: [value: number]
}>()

const minValue = ref(props.min)
const maxValue = ref(props.max)

function emitValues() {
  emit('changeMinPrice', minValue.value)
  emit('changeMaxPrice', maxValue.value)
}

/** Position (en %) d'une valeur sur la piste, bornée aux extrémités. */
function percent(value: number): number {
  const span = props.max - props.min
  if (span <= 0) return 0
  return Math.min(100, Math.max(0, ((value - props.min) / span) * 100))
}

const fillStyle = computed(() => ({
  left: `${percent(minValue.value)}%`,
  right: `${100 - percent(maxValue.value)}%`
}))

// Poignées confondues : celle du minimum passe devant dans la moitié haute,
// sinon, collée au maximum, elle ne pourrait plus être déplacée vers la gauche.
const minOnTop = computed(() => minValue.value > (props.min + props.max) / 2)

function onMinRange(event: Event) {
  const input = event.target as HTMLInputElement
  // Les poignées ne se croisent pas : le minimum bute sur le maximum.
  minValue.value = Math.min(Number(input.value), maxValue.value)
  input.value = String(minValue.value)
  emitValues()
}

function onMaxRange(event: Event) {
  const input = event.target as HTMLInputElement
  maxValue.value = Math.max(Number(input.value), minValue.value)
  input.value = String(maxValue.value)
  emitValues()
}

/** Saisie libre : vide ou invalide → borne par défaut ; négatif → 0. */
function parseTyped(raw: string, fallback: number): number {
  const value = Number(raw)
  if (raw.trim() === '' || !Number.isFinite(value)) return fallback
  return Math.max(props.min, value)
}

function onMinTyped(event: Event) {
  const input = event.target as HTMLInputElement
  minValue.value = Math.min(parseTyped(input.value, props.min), maxValue.value)
  input.value = String(minValue.value)
  emitValues()
}

function onMaxTyped(event: Event) {
  const input = event.target as HTMLInputElement
  // Pas de plafond à `max` : la saisie permet de chercher au-delà de la piste.
  maxValue.value = Math.max(parseTyped(input.value, props.max), minValue.value)
  input.value = String(maxValue.value)
  emitValues()
}
</script>

<template>
  <div class="slider-price__range">
    <div class="slider-price__track" aria-hidden="true">
      <div class="slider-price__fill" :style="fillStyle"></div>
    </div>
    <input
      type="range"
      class="slider-price__thumb"
      :class="{ 'slider-price__thumb--front': minOnTop }"
      :min="min"
      :max="max"
      :step="step"
      :value="minValue"
      aria-label="Prix minimum"
      :aria-valuetext="`${minValue} €`"
      @input="onMinRange"
    >
    <input
      type="range"
      class="slider-price__thumb"
      :min="min"
      :max="max"
      :step="step"
      :value="Math.min(maxValue, max)"
      aria-label="Prix maximum"
      :aria-valuetext="`${maxValue} €`"
      @input="onMaxRange"
    >
  </div>
  <div class="slider-price__inputs">
    <div class="slider-price__field">
      <span class="slider-price__currency">€</span>
      <input
        type="number"
        :min="min"
        :step="step"
        :value="minValue"
        placeholder="Min"
        aria-label="Prix minimum en euros"
        @change="onMinTyped"
      >
    </div>
    <span class="slider-price__separator">—</span>
    <div class="slider-price__field">
      <span class="slider-price__currency">€</span>
      <input
        type="number"
        :min="min"
        :step="step"
        :value="maxValue"
        placeholder="Max"
        aria-label="Prix maximum en euros"
        @change="onMaxTyped"
      >
    </div>
  </div>
</template>

<style scoped>
.slider-price__range {
  --slider-handle-size: 18px;
  --slider-track-height: 4px;
  position: relative;
  height: var(--slider-handle-size);
  margin: var(--space-sm) 0;
}

.slider-price__track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: var(--slider-track-height);
  transform: translateY(-50%);
  background: var(--surface-border);
  border-radius: var(--radius-full);
}

.slider-price__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--accent-pink);
  border-radius: var(--radius-full);
}

/*
 * Les deux curseurs occupent la même piste : l'input lui-même laisse passer les
 * clics (pointer-events: none), seule sa poignée les capte.
 */
.slider-price__thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider-price__thumb--front {
  z-index: 1;
}

.slider-price__thumb::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
}

.slider-price__thumb::-moz-range-track {
  background: transparent;
  border: none;
}

.slider-price__thumb::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--slider-handle-size);
  height: var(--slider-handle-size);
  border: 2px solid var(--bg-primary);
  border-radius: 50%;
  background: var(--accent-pink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: grab;
  pointer-events: auto;
  transition: box-shadow var(--transition-fast);
}

.slider-price__thumb::-moz-range-thumb {
  width: var(--slider-handle-size);
  height: var(--slider-handle-size);
  box-sizing: border-box;
  border: 2px solid var(--bg-primary);
  border-radius: 50%;
  background: var(--accent-pink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: grab;
  pointer-events: auto;
  transition: box-shadow var(--transition-fast);
}

.slider-price__thumb:focus {
  outline: none;
}

.slider-price__thumb:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px rgba(255, 45, 120, 0.25);
}

.slider-price__thumb:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px rgba(255, 45, 120, 0.25);
}

.slider-price__inputs {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.slider-price__field {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  transition: border-color var(--transition-fast);
}

.slider-price__field:focus-within {
  border-color: var(--accent-pink);
  box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
}

.slider-price__currency {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-right: 6px;
}

.slider-price__field input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
  -moz-appearance: textfield;
}

.slider-price__field input::-webkit-outer-spin-button,
.slider-price__field input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.slider-price__separator {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
