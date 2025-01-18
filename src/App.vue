<template>
  <RouterView />
</template>
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>
<style lang="scss">
@font-face {
    font-family: "Sora";
    src: url('~@/assets/fonts/Sora/Sora-VariableFont_wght.ttf');
}
body{
  font-family: "Sora", serif;
}
</style>
