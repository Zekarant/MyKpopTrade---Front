<template>
    <div class="product-grid">
        <card :data="data" @click="openPostInfo(index)" v-for="(data, index) in dataList" :key="index"></card>
    </div>
    <div v-if="dataList && dataList.length > 0 && pagination.page < pagination.pages && moreBtn" class="load-more">
        <button type="button" class="load-more-btn" @click="loadMore()">
          <i class="bi bi-arrow-down-circle"></i>
          Charger plus
        </button>
    </div>
    <Teleport to="body">
      <div v-if="stateCardPost" class="post-overlay" @click.self="closePost" >
          <post :key="dataCardPost?._id" @closePost="closePost" @sold="onsold" :myProfile="admin" :dataUser="dataUser" :idPost="dataCardPost?._id" />
      </div>
    </Teleport>
</template>


<script lang="ts">
    import { defineComponent, ref, nextTick } from 'vue';
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
            const dataCardPost = ref<any>(null);
            const stateCardPost = ref(false);
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
            async openPostInfo(index: number) {
                if(this.stateCardPost){
                    this.stateCardPost = false;
                    await nextTick();
                }
                this.dataCardPost = this.dataList[index];
                this.stateCardPost = true;
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
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--space-md);
      width: 100%;
    }

    .load-more {
      display: flex;
      justify-content: center;
      padding: var(--space-xl) 0;
    }

    .load-more-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: 12px 28px;
      background: transparent;
      color: var(--text-primary);
      border: 1.5px solid var(--surface-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: var(--font-size-sm);
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      transition: all var(--transition-base);

      i, .bi {
        font-size: 1.1em;
      }

      &:hover {
        border-color: var(--accent-pink);
        color: var(--accent-pink);
        background: rgba(255, 45, 120, 0.05);
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .product-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-sm);
      }
    }
  </style>
