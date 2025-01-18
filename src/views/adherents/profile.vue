<template>
    <main >
        <Nav_bar></Nav_bar>        

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import Nav_bar from '@/components/adherents/nav_bar.vue';


  export default defineComponent({
    name: 'profile',
    components: {
        Nav_bar
    },
    setup() {
    return {
  
    };
  },
  })
  </script>
  
<style lang="scss" scoped>
 
</style>
  