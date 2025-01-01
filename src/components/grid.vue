<template>
   <div class="container">
        <div v-for="(data, index) in dataList"  class="card">
            <a class="back" href="#">
                <Card class="screen" :frontImage="data.imgFront" :backImage="data.imgBack"></Card>
            </a>
            <div class="description">
                <h2><a href="#">{{ data.name }}</a></h2>
            </div>
            <div class="shop">
                <h3>{{ data.price }}<span>€</span></h3>
                <button>Échanger</button>
            </div>
        </div>

    </div>
</template>
  

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import axios from 'axios';
    import Card from '../components/card.vue';

    export default defineComponent({
        name: "Grid",
        components: {
            Card,
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
    }
    .card {
        height: 430px;
        border-radius: 3px;
        box-shadow: 0 0 0 1px #d2d2d22b, 
            0 0 20px #0000002b;
        font-family: monospace;
        text-decoration: none;
        transition: all 0.3s;
    }
    .card:hover {
    box-shadow: 0 0 0 1px #d2d2d22b, 
        0 0 20px #ff00002b;
    }
    .card .back {
        display: flex;
        width: 100%;
        height: calc(100% - 8rem);
        border-radius: 3px 3px 0 0;
        position: relative;
        text-decoration: none;
        align-items: center;
        justify-content: center;
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
    .card .description {
        display: flex;
        width: calc(100% - 1rem);
        height: 3rem;
        padding: 0.5rem;
        justify-content: center;
        align-items: center;
        font-size: 1.2rem;
        text-decoration: none;
        text-transform: uppercase;
        text-align: center;
        color: #000;
        z-index: 3;
    }
    .card .description h2 {
    font-size: 1rem;
    }
    .card .description h2 a {
        text-decoration: none;
        color: #000;
    }
    .card .description h2 a:hover {
        color: var(--primary-color);
    }
    .card .shop {
        display: flex;
        width: calc(100% - 2rem);
        //height: 2rem;
        align-items: center;
        padding: 1rem;
        color: var(--primary-color);
        flex-direction: column;    
    }
    .card .shop button {
    background: #fff;
    border: 0;
    box-shadow: 0 0 0 1px #d4d4d4;
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.3s;
    }
    .card .shop button:hover {
    background: var(--primary-color);
    color: #fff;
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
    }
    @media (max-width:550px){
    .container{
        grid-template: auto / repeat(1, 1fr)
    }
    }
  </style>
  