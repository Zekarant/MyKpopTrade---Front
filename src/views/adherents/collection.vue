<template>
    <main >

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import authentification from '@/services/authentification.service';

  export default defineComponent({
    name: 'dashboard',
    components: {
    },
    setup() {
      return {
    
      };
    },
    mounted() {
      authentification.verifSession();
    },
  })
  </script>
  
<style lang="scss" scoped>
 
</style>
  