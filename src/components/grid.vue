<template>
   <div class="container">
        <card :data="data" v-on:click="openPostInfo(index)" v-for="(data, index) in dataList"></card>
    </div>
    <div v-if="stateCardPost" class="post-overlay" @click.self="closePost" >
        <post @sold="onsold" :dataUser="dataUser" :dataPost="dataCardPost" />
    </div>
</template>
  

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import axios from 'axios';
    import card_illu from '../components/card_illu.vue';
    import post from '../components/post.vue';
    import card from '../components/card.vue';

    export default defineComponent({
        name: "Grid",
        components: {
            card_illu,
            post,
            card
        },
        props: {
            dataList: {
                type: Array as () => Array<{
                    condition: any;
                    isAvailable: any; id: number; title: string; state: string; price: number; isReserved: boolean; images: string[] 
}>,
                required: true,
            },
            dataUser: {
                type: Object,
                required: false,
            },
            admin: {
                type: Boolean,
                required: false,
                default: false,
            },
        },
        setup() {
            var dataCardPost: any = null;
            var stateCardPost = ref(false);
            return {
                dataCardPost,
                stateCardPost,
            };
        },
        methods: {
            openPostInfo(index: number) {
                if(this.stateCardPost){
                    this.stateCardPost = false;
                    this.dataCardPost = this.dataList[index];
                    this.stateCardPost = true;
                }else{
                    this.dataCardPost = this.dataList[index];
                    this.stateCardPost = true;
                }
              
            },
            onsold() {
                this.stateCardPost = false;
            },
            closePost() {
                this.stateCardPost = false;
            },
        },
    });

  </script>
  
  <style lang="scss" scoped>
    .banner_reserved{
        background: var(--danger-color);
        width: 100%;
        position: absolute;
        top: 0;
        z-index: 9;
    }
    .banner_draft{
        background: var( --secondary-color-shade);
        width: 100%;
        position: absolute;
        top: 0;
        z-index: 9;
    }
    .banner_reserved .state_reserved,  .banner_draft .state_draft{
        color: white;
        font-size: smaller;
        font-weight: bold;
        text-align: center;
    }
    .container {
        display: grid;
        grid-template: auto / repeat( 4, 1fr );
        //grid-gap: 2rem;
        align-items: center;
        justify-self: center;
        max-width: 990px;
        width: 100%;
    }
    

    .post-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5); /* Fond noir transparent */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* Assurez-vous que le composant est au-dessus des autres éléments */
    }

    .post-overlay post {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
    }

    @media (max-width:980px){
    .container{
        grid-template: auto / repeat(auto, 1fr)
    }
    }
    @media (max-width:720px){
        .container{
            grid-template: auto / repeat(2, 1fr);
            width: 96vw;
            margin-right: 0px;
            padding-right: 0px;
            margin-left: 0px;
            padding-left: 0px;
        }
    }
    @media (max-width:550px){
        .container{
            grid-template: auto / repeat(1, 1fr)
        }
    }
  </style>
  