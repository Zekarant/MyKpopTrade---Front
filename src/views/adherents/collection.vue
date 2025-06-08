<template>
    <main >

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';


  export default defineComponent({
    name: 'dashboard',
    components: {
    },
    setup() {
      return {
    
      };
    },
    mounted() {
      this.$func.verifSession();
    },
  })
  </script>
  
<style lang="scss" scoped>
 
</style>
  