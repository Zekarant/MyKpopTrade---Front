<template>
    <main >
        <left_menu></left_menu>        

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';

    import left_menu from '@c_a/left_menu.vue';

  export default defineComponent({
    name: 'dashboard',
    components: {
        left_menu,
    },
    setup() {
    return {
  
    };
  },
  })
  </script>
  
<style lang="scss" scoped>
 
</style>
  