<template>
    <main>
        <Nav_bar></Nav_bar>        
        <div>
          <!-- Search bar -->
        </div>
     

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useRouter } from "vue-router";

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import authentificationService from '@/services/authentification.service';
  export default defineComponent({
    name: 'admin',
    components: {
      Nav_bar,

    },
    mounted() {
      authentificationService.verifSession().then(() => {
        authentificationService.logout(); //pas d'accès pour le moment
      });
     
    },
    created() {


    },
    setup() {
      const router = useRouter();

      return {
          router
      };
    },
    data(): { 

    } {
      return {
      
      };
    },
    methods: {
     
    },
  })
  </script>
  
<style lang="scss" scoped>

</style>
  