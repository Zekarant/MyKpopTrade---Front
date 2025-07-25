<template>
  <RouterView />
      <Vue3Lottie v-if="showLoader" :animationData="animationData"  />

</template>
<script setup lang="ts">
import './css/main.css'

import { RouterView } from 'vue-router';
import { onMounted, onUnmounted, ref } from 'vue';
import { Vue3Lottie } from 'vue3-lottie';
import * as animationData from '@/assets/Animation/loadAnim.json';
//import eventBus from '@/eventBus'

const showLoader = ref(false)

function show() { showLoader.value = true }
function hide() { showLoader.value = false }

/*onMounted(() => {
  eventBus.on('show-loader', show)
  eventBus.on('hide-loader', hide)
})
onUnmounted(() => {
  eventBus.off('show-loader', show)
  eventBus.off('hide-loader', hide)
})*/
</script>
<style lang="scss">
@font-face {
    font-family: "Sora";
    src: url('@/assets/fonts/Sora/Sora-VariableFont_wght.ttf');
}
body{
  font-family: "Sora", serif;
}
</style>
