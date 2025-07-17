<template>
  <nav class="pagination">
    <button
      :disabled="currentPage === min"
      @click="goToPage(currentPage - 1)"
      class="pagination-btn"
    >
      &lt;
    </button>
    <button
      v-for="page in pagesToShow"
      :key="page"
      :class="['pagination-btn', { active: page === currentPage, dots: page === '...' }]"
      @click="typeof page === 'number' && goToPage(page)"
      :disabled="page === '...'"
    >
      {{ page }}
    </button>
    <button
      :disabled="currentPage === max"
      @click="goToPage(currentPage + 1)"
      class="pagination-btn"
    >
      &gt;
    </button>
  </nav>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';

export default defineComponent({
  name: "pagination",
  props: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    modelValue: { type: Number, default: 1 }, // page courante
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const currentPage = ref(props.modelValue);

    watch(() => props.modelValue, (val) => {
      currentPage.value = val;
    });

    function goToPage(page: number) {
      if (page >= props.min && page <= props.max && page !== currentPage.value) {
        emit('update:modelValue', page);
        currentPage.value = page;
      }
    }

    const pagesToShow = computed(() => {
      const pages: (number | string)[] = [];
      if (props.max <= 5) {
        for (let i = props.min; i <= props.max; i++) pages.push(i);
      } else {
        if (currentPage.value <= 3) {
          for (let i = props.min; i <= 4; i++) pages.push(i);
          pages.push('...');
          pages.push(props.max);
        } else if (currentPage.value >= props.max - 2) {
          pages.push(props.min);
          pages.push('...');
          for (let i = props.max - 3; i <= props.max; i++) pages.push(i);
        } else {
          pages.push(props.min);
          pages.push('...');
          pages.push(currentPage.value - 1, currentPage.value, currentPage.value + 1);
          pages.push('...');
          pages.push(props.max);
        }
      }
      return pages;
    });

    return { currentPage, goToPage, pagesToShow };
  }
});
</script>

<style lang="scss" scoped>
.pagination {
  display: flex;
  gap: 0.3em;
  align-items: center;
}
.pagination-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 0.3em 0.7em;
  cursor: pointer;
  &.active {
    background: var(--primary-color, #819A57);
    color: #fff;
    font-weight: bold;
  }
  &.dots {
    cursor: default;
    border: none;
    background: none;
  }
}
</style>