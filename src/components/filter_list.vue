<template>
  <!--
  - type : OK
  - kpopGroup 
  - kpopMember 
  - minPrice : OK
  - maxPrice : OK
  - conditions : OK
  
  -->
  <div class="filter_mobile">
    <div @click="showFilterList" class="filter_btn">
      <i v-if="!filterMobileOpen" class="bi bi-filter"></i>
    </div>
  </div>
  <div class="filter-list imgcenter" ref="filterMobile">
    <div @click="showFilterList" class="filter_btn filter_btn-close">
      <i v-if="filterMobileOpen" class="bi bi-x-lg"></i>
    </div>
    <span style="font-weight: bold; font-size: 18px;">Filters</span>
    <div class="filter-row">
      <div class="select-wrapper">
        <select v-model="tabFilter.conditions" class="select-primary">
          <option value="null">All conditions</option>
            <option value="new">Neuf</option>
            <option value="likeNew">Comme neuf</option>
            <option value="good">Bon état</option>
            <option value="fair">État moyen</option>
            <option value="poor">Mauvais état</option>
        </select>
        <i class="bi bi-chevron-expand chevron-icon"></i>
      </div>
    </div>
    <div class="filter-row">
      <div class="select-wrapper">
        <select v-model="tabFilter.type" class="select-primary">
          <option value="null">All type</option>
          <option value="photocard">Photocard</option>
          <option value="album">Album</option>
          <option value="merch">Merch</option>
          <option value="other">Autre</option>
        </select>
        <i class="bi bi-chevron-expand chevron-icon"></i>
      </div>
    </div>
    <div>
      <div style="font-size: 18px;">Prix</div>
      <br>
      <slider_price @changeMinPrice="onChangeMinPrice" @changeMaxPrice="onChangeMaxPrice"></slider_price>

    </div>

    <div class="filter-actions">
      <button style="width: 100%;" @click="saveFilter" class="btn-primary">Apply Filters</button>
    </div>
  </div>
</template>

<script lang="ts">
 import { ref } from "vue";
  import slider_price from "../components/slider_price.vue";

export default {
  
  name: "filter_list",
  emits: ['saveFilter'],

  setup(){
    const tabFilter = ref({
      min: 0,
      max: 100,
      conditions: null,
      type: null
    });
    const filterMobileOpen = ref(false);

    function onChangeMinPrice(val: number) {
      tabFilter.value.min = val;
    }
    function onChangeMaxPrice(val: number) {
      tabFilter.value.max = val;
    }
    return {
      tabFilter,
      onChangeMinPrice,
      onChangeMaxPrice,
      filterMobileOpen
    }
  },
  methods: {
    saveFilter() {
      this.$emit('saveFilter', this.tabFilter)
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
.filter-list {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 20px;
  padding-left: 20px;
  padding-top: 20px;
}
h3 {
  padding: 1rem 0 0.5rem 0;
}
.filter-row {
  margin-left: auto; 
	margin-right: auto; 
	display: block;
  width: 100%;
  margin-bottom: 0.5rem;
}
.select-wrapper {
  position: relative;
  width: 100%;
}
.select-primary {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 2.5em;
  border: solid 1px var(--light-color-shade);
}
.chevron-icon {
  position: absolute;
  right: 1em;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--primary-color, #819A57);
  font-size: 1.2em;
}
.filter-actions {
  padding: 1rem 0;
}
@media (max-width: 769px) {

  .bi.bi-filter {
    font-size: 1.5em; 
    vertical-align:sub
  }
  .bi-x-lg {
    font-size: 2em;
  }
  .filter-list.show{
    width: 100%;
    height: 100%;
    background: white;
    max-width: 100%;
    position: absolute;
    z-index: 99;
    left: 0px;
    top: 0px
  }
  .filter_btn-close {
    margin-left: auto;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    cursor: pointer;
  }
}


</style>