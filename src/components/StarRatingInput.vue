<template>
  <div class="rating-selector">
    <div class="stars" role="radiogroup" :aria-labelledby="labelledby">
      <button
        v-for="star in MAX_RATING"
        :key="star"
        :ref="(el) => registerStar(star, el)"
        type="button"
        class="star-btn"
        :class="{ active: star <= rating }"
        role="radio"
        :aria-checked="star === rating"
        :aria-label="`${star} étoile${star > 1 ? 's' : ''}`"
        :tabindex="star === rating ? 0 : -1"
        @click="rating = star"
        @keydown.right.prevent="step(1)"
        @keydown.up.prevent="step(1)"
        @keydown.left.prevent="step(-1)"
        @keydown.down.prevent="step(-1)"
      >
        <i class="bi bi-star-fill"></i>
      </button>
    </div>
    <span class="rating-text">{{ rating }}/{{ MAX_RATING }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Note de 1 à 5 étoiles. Groupe de boutons radio au sens ARIA : un seul arrêt
 * de tabulation, les flèches changent la note.
 */
defineProps<{
  /** Identifiant du libellé visible du champ. */
  labelledby?: string;
}>();

const rating = defineModel<number>({ required: true });

const MAX_RATING = 5;
const starButtons: (HTMLButtonElement | null)[] = [];

const registerStar = (star: number, el: unknown) => {
  starButtons[star - 1] = el instanceof HTMLButtonElement ? el : null;
};

function step(delta: number) {
  const next = Math.min(Math.max(rating.value + delta, 1), MAX_RATING);
  rating.value = next;
  // Le focus suit la note, sinon il resterait sur une étoile devenue non
  // tabulable. `next` et non `rating.value` : en v-model, ce dernier ne change
  // qu'une fois la prop redescendue du parent.
  starButtons[next - 1]?.focus();
}
</script>

<style scoped lang="scss">
.rating-selector {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;

  .stars {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .star-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 32px;
    color: var(--secondary-color-tint);
    transition: all 0.3s ease;
    padding: 0;

    &:hover,
    &.active {
      color: var(--primary-color);
      transform: scale(1.2);
    }
  }

  .rating-text {
    font-size: 14px;
    color: var(--secondary-color);
  }
}

@media (max-width: 768px) {
  .rating-selector .star-btn {
    font-size: 28px;
  }
}
</style>
