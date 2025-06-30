<script setup>
import { ref, computed, watch } from 'vue';
import Slider from 'primevue/slider'; //https://primevue.org/slider/
const emit = defineEmits(['changeMinPrice', 'changeMaxPrice']);

const value = ref([0, 100]);
function change() {
    emit('changeMinPrice', value.value[0]);
    emit('changeMaxPrice', value.value[1]);
}




</script>

<template>

    <Slider :value-change="change()" v-model="value" range class="w-56 rangePrice" />
    <div class="rangeInputContent">
        <input @change="change" type="text" v-model="value[0]">
        <input @change="change" style="text-align: end;" type="text" v-model="value[1]">
    </div>

</template>

<style scoped>
.rangePrice{
    --p-slider-range-background: var(--primary-color);
    --p-slider-track-background : var(--light-color);
}
.rangeInputContent{
    display: flex;
}
.rangeInputContent input{
    border: none;
    margin: 5px;
    width: 50%;
}
</style>
