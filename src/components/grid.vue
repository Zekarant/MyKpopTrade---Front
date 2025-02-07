<template>
   <div class="container">
        <div v-for="(data, index) in dataList"  class="card">
            <div class="back" href="#">
                <card_illu class="screen" :frontImage="data.imgFront" :backImage="data.imgBack"></card_illu>
            </div>
            <div style="padding-bottom: 8px;padding-left: 5px;">
                <div class="name"><a href="#">{{ data.name }}</a></div>
                <div class="state">
                    <span>{{ data.state }}</span>            
                </div>
                <div class="shop">
                    <span>€ {{ data.price }}</span>            
                </div>
            </div>

        </div>

    </div>
</template>
  

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import axios from 'axios';
    import card_illu from '../components/card_illu.vue';

    export default defineComponent({
        name: "Grid",
        components: {
            card_illu,
        },
        props: {
            dataList: {
                type: Array,
                required: true,
            },
        },
    });

  </script>
  
  <style lang="scss" scoped>
    .container {
        display: grid;
        grid-template: auto / repeat( 4, 1fr );
        //grid-gap: 2rem;
        align-items: center;
        justify-self: center;
        max-width: 990px;
        width: 100%;
    }
    .card {
        margin-bottom: 15px;        
        width: 90%;
        border-radius: 8px;
        font-family: monospace;
        text-decoration: none;
        transition: all 0.3s;
        border: none;
    }
    .card:hover {
    box-shadow: 0 0 0 1px #d2d2d22b, 
        0 0 20px #ff00002b;
    }
    .card .back {
        display: flex;
        width: 100%;
        aspect-ratio: 1 / 1;        
        border-radius: 8px;
        position: relative;
        text-decoration: none;
        align-items: center;
        justify-content: center;
        background: var(--primary-color);
    }
    .card .screen {
        display: block;
        margin-right: auto;
        margin-left: auto;

        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        border-radius: 3px 3px 0 0;
        z-index: 1;

    }
    .card .name a{
        font-family: "Sora", serif;
        font-size: small;
        font-weight: 600;
        line-height: 7.56px;
        text-align: left;
        text-decoration-skip-ink: none;
        color: var(--primary-color);
        text-decoration: none;

    }

    .card .back h4 {
        width: 100%;
        height: 100%;
        margin: 0;
        z-index: 5;
        align-items: center;
        justify-content: center;
        text-align: center;
        display: flex;
        color: #ffffff00;
        font-size: 1.2rem;
        letter-spacing: 1px;
        text-transform: uppercase;
    /*    background: radial-gradient( #0000, #000000d1 ); */
        opacity: 0;
        transition: all 0.2s;
        text-shadow: 2px 2px 0px #00000000;
    }
    .card .back:hover h4 {
        opacity: 1;
    }
    .card .state{
        font-family: "Sora", serif;
        font-size: x-small;
        font-weight: 504;
        line-height: 7.56px;
        text-align: left;
        text-decoration-skip-ink: none;
        color: var(--primary-color);

    }
    .card .shop {
        display: flex;
        width: calc(100% - 2rem);
        align-items: start;
        color: var(--blue);
        flex-direction: column;    
        font-family: "Sora", serif;
        font-size: small;
        font-weight: 504;
        line-height: 10.08px;
        text-align: left;
        text-decoration-skip-ink: none;
        margin-top: 10px;

    }

    .shop span {
        padding-left: 2px;
    }
    .card .shop:before {
        content: '';
        display: flex;
        align-self: flex-start;
        width: calc(100% - 2rem);
        margin: 0 1rem;
        position: absolute;
        top: 0;
        left: 0;
        height: 1px;
        background: #e6e6e6;
    }



    @media (max-width:980px){
    .container{
        grid-template: auto / repeat(auto, 1fr)
    }
    }
    @media (max-width:720px){
        .container{
            grid-template: auto / repeat(2, 1fr)
        }
        .card{
            margin-left: auto; 
            margin-right: auto; 
            display: block;
            width: 70%;
        }
    }
    @media (max-width:550px){
    .container{
        grid-template: auto / repeat(1, 1fr)
    }
    }
  </style>
  