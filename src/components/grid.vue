<template>
    <!-- Racines multiples : les attributs du parent (ex. style) vont sur la grille elle-même. -->
    <div class="product-grid" v-bind="$attrs">
        <card
            v-for="item in dataList"
            v-show="!isRemoved(item)"
            :key="item._id"
            :data="item"
            :admin="admin"
            @open="openPost"
            @remove-favorite="removeFavorite"
        />
    </div>
    <div v-if="dataList.length > 0 && hasMorePages(pagination) && moreBtn" class="load-more">
        <button type="button" class="load-more-btn" @click="loadMore">
          <i class="bi bi-arrow-down-circle" aria-hidden="true"></i>
          Charger plus
        </button>
    </div>
    <Teleport to="body">
      <DialogFrame v-if="openedPost" v-dismiss="closePost" class="post-overlay" :aria-label="openedPost.title" @close="closePost">
          <post :key="openedPost._id" :id-post="openedPost._id" :my-profile="admin" :data-user="dataUser" @close-post="closePost" @sold="closePost" />
      </DialogFrame>
    </Teleport>
</template>

<script setup lang="ts">
/** Grille d'annonces ; un clic ouvre la fiche en surimpression. */
import { useRouter } from 'vue-router';
import post from '@/components/post.vue';
import card from '@/components/card.vue';
import DialogFrame from '@/components/DialogFrame.vue';
import type { Post } from '@/types/post.types';
import { hasMorePages, type ListPagination, type PostSeller } from '@/components/post/types';
import { useFavoriteRemoval } from '@/composables/useFavoriteRemoval';
import { usePostOverlay } from '@/components/post/usePostOverlay';
import { vDismiss } from '@/composables/vDismiss';

defineOptions({ name: 'ProductGrid', inheritAttrs: false });

const props = withDefaults(defineProps<{
    dataList: Post[];
    /** Profil d'où la grille est affichée : transmis à la fiche comme vendeur. */
    dataUser?: PostSeller;
    /** Annonces du membre connecté : la fiche propose les actions du vendeur. */
    admin?: boolean;
    pagination?: ListPagination;
    moreBtn?: boolean;
}>(), {
    dataUser: undefined,
    admin: false,
    pagination: () => ({ limit: 1, page: 1, pages: 1, total: 10 }),
    moreBtn: false,
});

const router = useRouter();
const { isRemoved, removeFavorite } = useFavoriteRemoval();
const { openedPost, openPost, closePost } = usePostOverlay();

/** La page de recherche reprend la liste déjà chargée et poursuit la pagination. */
function loadMore() {
    sessionStorage.setItem('posts_str', JSON.stringify(props.dataList));
    sessionStorage.setItem('pagination_str', JSON.stringify(props.pagination));
    router.push({ name: 'searchList', query: { event: 'morePage' } });
}
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
        background: color-mix(in srgb, var(--accent-pink) 5%, transparent);
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
