<template>
    <main>
        <Grid :dataList="dataCardList"></Grid>
    </main>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  import Grid from '../components/grid.vue';
  
  export default defineComponent({
    name: 'test',
    components: {
        Grid,
    },
    setup() {
        const dataCardList = ref([
        {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,

            },
            {
                name: "Name Card",
                imgFront: "https://cdn.shopify.com/s/files/1/0469/3927/5428/products/txt-lucky-draw-unit-photocard-temptation-nolae-822501_400x400.jpg?v=1701359489",
                imgBack: "https://files.a-fa.tw/images/card_back.jpg",
                price: 5.5,

            },
        ]);
        return {
            dataCardList,
        };

    }
  });
  </script>
  
  <style lang="scss" scoped>
  
  </style>
  