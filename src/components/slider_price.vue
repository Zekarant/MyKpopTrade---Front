<script setup lang="ts">
import { ref } from 'vue';
import Slider from 'primevue/slider'; //https://primevue.org/slider/
const emit = defineEmits(['changeMinPrice', 'changeMaxPrice']);

const value = ref([0, 100]);
function change() {
    emit('changeMinPrice', value.value[0]);
    emit('changeMaxPrice', value.value[1]);
}
</script>

<template>
    <Slider :value-change="change()" v-model="value" range class="slider-price__range" />
    <div class="slider-price__inputs">
        <div class="slider-price__field">
            <span class="slider-price__currency">€</span>
            <input @change="change" type="number" min="0" v-model="value[0]" placeholder="Min">
        </div>
        <span class="slider-price__separator">—</span>
        <div class="slider-price__field">
            <span class="slider-price__currency">€</span>
            <input @change="change" type="number" min="0" v-model="value[1]" placeholder="Max">
        </div>
    </div>
</template>

<style scoped>
.slider-price__range {
    --p-slider-range-background: var(--accent-pink);
    --p-slider-handle-background: var(--accent-pink);
    --p-slider-track-background: var(--surface-border);
    --p-slider-handle-width: 18px;
    --p-slider-handle-height: 18px;
    margin: var(--space-sm) 0;
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
