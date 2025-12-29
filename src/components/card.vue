<template>
    <div class="card">
        <div class="back" href="#">
            <div v-if="admin && !data.isAvailable" class="banner_draft">
                <div class="state_draft">Brouillon</div>
            </div>
            <div v-else-if="data.isReserved" class="banner_reserved">
                <div class="state_reserved">Réservé</div>
            </div>
            <!--<card_illu class="screen" :frontImage="data.imgFront" :backImage="data.imgBack"></card_illu>-->
            <ImageCarousel class="screen"  :images="data.images" />

        </div>
        <div style="padding-bottom: 8px;padding-left: 5px;">
            <div class="name"><a href="#">{{ data.title }}</a></div>
            <div class="state">
                <span>{{ data.condition.charAt(0).toUpperCase() + data.condition.slice(1) }}</span>            
            </div>
            <div class="shop">
                <span>€ {{ data.price }}</span>            
            </div>
        </div>
    </div>
</template>
  
  <script lang="ts">
    import ImageCarousel from '@/components/ImageCarousel.vue';

    export default {

        name: "card",
       components: {
            ImageCarousel,
        },
        props: {
            data: {
                type: Object,
                required: true,
            },
            admin: {
                type: Boolean,
                required: false,
                default: false,        
            },
        },
    };

  </script>
  
  <style lang="scss" scoped>
    .card {
        height: 100%;
        margin-bottom: 15px;        
        width: 90%;
        border-radius: 8px;
        font-family: monospace;
        text-decoration: none;
        transition: all 0.3s;
        border: none;
        cursor: pointer;
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
    @media (max-width:720px){

        .card{
            margin-left: auto; 
            margin-right: auto; 
            display: block;
            width: 70%;
        }
    }
  </style>
  