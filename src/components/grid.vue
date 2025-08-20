<template>
    <div :style="style" class="container">
        <card :data="data" @click="openPostInfo(index)" v-for="(data, index) in dataList"></card>
    </div>
    <div v-if="dataList && dataList.length > 0 && pagination.page < pagination.pages && moreBtn" class="load-more"  @click="loadMore()">
        <button class="btn btn-primary-outline imgcenter">Charger plus</button> 
    </div>
    <div v-if="stateCardPost" class="post-overlay" @click.self="closePost" >
        <post @closePost="closePost" @sold="onsold" :myProfile="admin" :dataUser="dataUser" :idPost="dataCardPost._id" />
    </div>
</template>
  

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useRouter } from "vue-router";
    import card_illu from '@/components/card_illu.vue';
    import post from '@/components/post.vue';
    import card from '@/components/card.vue';



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
            pagination: {
                type: Object,
                required: false,
                default: () => ({
                    limit: 1,
                    page: 1,
                    pages: 1,
                    total: 10,
                }),
            },
            moreBtn:{
                type: Boolean,
                required: false,
            },
            style: {
                required: false,
                type: Object,
            } 

        },
        setup() {
            const router = useRouter();
            var dataCardPost: any = null;
            var stateCardPost = ref(false);
            return {
                dataCardPost,
                stateCardPost,
                router
            };
        },
        data() {
            return {

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
            loadMore(){
                sessionStorage.setItem('posts_str', JSON.stringify(this.dataList));
                sessionStorage.setItem('pagination_str', JSON.stringify(this.pagination));
                const combined = this.$func.buildCombinedSlug('', 'morePage');

                this.router.push({
                    name: 'searchList',
                    params: { combined }
                });
            }
            
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
    .load-more{
        display: flex;
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
  