<template>
  <div class="filter_mobile">
    <button @click="showFilterList" class="filter-toggle-btn">
      <i class="bi bi-sliders"></i>
      <span>Filtres</span>
    </button>
  </div>
  <div class="filter-panel" ref="filterMobile">
    <div class="filter-panel__header">
      <h3 class="filter-panel__title">
        <i class="bi bi-sliders"></i> Filtres
      </h3>
      <button @click="showFilterList" class="filter-panel__close">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label">Groupe K-pop</label>
      <div class="filter-panel__autocomplete">
        <input
          v-model="groupSearchInput"
          @input="searchGroupsDebounced"
          type="text"
          class="filter-panel__input"
          placeholder="Rechercher un groupe..."
        />
        <ul v-if="groupSuggestions.length" class="filter-panel__suggestions">
          <li v-for="g in groupSuggestions" :key="g._id" @click="selectGroup(g)">{{ g.name }}</li>
        </ul>
      </div>
      <div v-if="tabFilter.group" class="filter-panel__tag">
        {{ tabFilter.group }}
        <button @click="tabFilter.group = null; groupSearchInput = ''" class="filter-panel__tag-remove">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label">Membre</label>
      <input
        v-model="tabFilter.member"
        type="text"
        class="filter-panel__input"
        placeholder="Nom du membre..."
      />
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label">État</label>
      <select v-model="tabFilter.conditions" class="filter-panel__select">
        <option value="null">Tous les états</option>
        <option value="new">Neuf</option>
        <option value="likeNew">Comme neuf</option>
        <option value="good">Bon état</option>
        <option value="fair">État moyen</option>
        <option value="poor">Mauvais état</option>
      </select>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label">Type</label>
      <select v-model="tabFilter.type" class="filter-panel__select">
        <option value="null">Tous les types</option>
        <option value="photocard">Photocard</option>
        <option value="album">Album</option>
        <option value="merch">Merch</option>
        <option value="other">Autre</option>
      </select>
    </div>

    <div class="filter-panel__section">
      <label class="filter-panel__label">Prix</label>
      <slider_price @changeMinPrice="onChangeMinPrice" @changeMaxPrice="onChangeMaxPrice"></slider_price>
    </div>

    <div class="filter-panel__actions">
      <button @click="resetFilters" class="filter-panel__btn filter-panel__btn--ghost">
        <i class="bi bi-arrow-counterclockwise"></i> Réinitialiser
      </button>
      <button @click="saveFilter" class="filter-panel__btn filter-panel__btn--primary">
        <i class="bi bi-check-lg"></i> Appliquer
      </button>
    </div>
  </div>
</template>

<script lang="ts">
 import { ref } from "vue";
  import slider_price from "../components/slider_price.vue";
  import groupService from '@/services/group.service';

export default {

  name: "filter_list",
  emits: ['saveFilter'],

  setup(){
    const tabFilter = ref({
      min: 0,
      max: 100,
      conditions: null as string | null,
      type: null as string | null,
      group: null as string | null,
      member: null as string | null,
    });
    const filterMobileOpen = ref(false);
    const groupSearchInput = ref('');
    const groupSuggestions = ref<any[]>([]);
    let groupTimer: any = null;

    function onChangeMinPrice(val: number) {
      tabFilter.value.min = val;
    }
    function onChangeMaxPrice(val: number) {
      tabFilter.value.max = val;
    }
    function resetFilters() {
      tabFilter.value = { min: 0, max: 100, conditions: null, type: null, group: null, member: null };
      groupSearchInput.value = '';
      groupSuggestions.value = [];
    }
    function searchGroupsDebounced() {
      clearTimeout(groupTimer);
      groupTimer = setTimeout(async () => {
        if (groupSearchInput.value.trim().length >= 2) {
          try {
            groupSuggestions.value = await groupService.searchGroups(groupSearchInput.value);
          } catch { groupSuggestions.value = []; }
        } else {
          groupSuggestions.value = [];
        }
      }, 250);
    }
    function selectGroup(group: any) {
      tabFilter.value.group = group.name;
      groupSearchInput.value = group.name;
      groupSuggestions.value = [];
    }
    return {
      tabFilter,
      onChangeMinPrice,
      onChangeMaxPrice,
      filterMobileOpen,
      resetFilters,
      groupSearchInput,
      groupSuggestions,
      searchGroupsDebounced,
      selectGroup
    }
  },
  methods: {
    saveFilter() {
      this.$emit('saveFilter', this.tabFilter);
      // Close on mobile after apply
      if (window.innerWidth <= 769) {
        this.showFilterList();
      }
    },
    showFilterList(){
      const el = this.$refs.filterMobile as HTMLElement;
      if (el && !el.classList.contains('show')) {
        el.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.filterMobileOpen = true;
      }else{
        el.classList.remove('show');
        document.body.style.overflow = '';
        this.filterMobileOpen = false;
      }
    }
  },
  components:{
    slider_price
  }

};
</script>

<style lang="scss" scoped>
.filter-panel {
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  position: sticky;
  top: calc(var(--navbar-height) + var(--space-lg));
}

.filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-panel__title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-primary);

  i { color: var(--accent-pink); }
}

.filter-panel__close {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);

  &:hover { background: var(--surface-hover); }
}

.filter-panel__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.filter-panel__label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-panel__select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  appearance: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236c757d' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;

  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }
}

.filter-panel__actions {
  display: flex;
  gap: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--surface-border);
}

.filter-panel__input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }
}

.filter-panel__autocomplete {
  position: relative;
}

.filter-panel__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  max-height: 160px;
  overflow-y: auto;
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 4px 0 0;

  li {
    padding: 8px 14px;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--text-primary);

    &:hover {
      background: var(--surface-hover);
    }
  }
}

.filter-panel__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  padding: 4px 10px;
  background: var(--accent-pink);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.filter-panel__tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.filter-panel__btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  transition: all var(--transition-fast);
  border: none;

  &--primary {
    background: var(--accent-gradient);
    color: white;
    box-shadow: 0 2px 8px rgba(255, 45, 120, 0.2);

    &:hover {
      box-shadow: 0 4px 16px rgba(255, 45, 120, 0.3);
      transform: translateY(-1px);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--surface-border);

    &:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }
  }
}

// Mobile toggle button
.filter_mobile {
  display: none;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--accent-pink);
    color: var(--accent-pink);
  }
}

@media (max-width: 769px) {
  .filter_mobile {
    display: block;
  }

  .filter-panel {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    max-width: 100%;
    border-radius: 0;
    overflow-y: auto;
    padding: var(--space-xl);

    &.show {
      display: flex;
    }
  }

  .filter-panel__close {
    display: flex;
  }
}
</style>
