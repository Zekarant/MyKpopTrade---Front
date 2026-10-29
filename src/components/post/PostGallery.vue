<template>
    <div class="post-modal__gallery">
        <div v-if="post.isSold" class="post-modal__badge post-modal__badge--sold">
            <i class="bi bi-bag-check-fill" aria-hidden="true"></i> Vendu
        </div>
        <div v-else-if="post.isAvailable === false" class="post-modal__badge post-modal__badge--withdrawn">
            <i class="bi bi-eye-slash" aria-hidden="true"></i> Retiré de la vente
        </div>
        <ImageCarousel :images="post.images || []" :alt="post.title" />
        <button
            v-if="canFavorite"
            type="button"
            class="post-modal__fav-btn"
            :class="{ 'post-modal__fav-btn--active': favorite }"
            :aria-pressed="favorite"
            :aria-label="favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            @click="toggleFavorite"
        >
            <i class="bi" :class="favorite ? 'bi-heart-fill' : 'bi-heart'" aria-hidden="true"></i>
        </button>
    </div>
</template>

<script setup lang="ts">
/** Photos de l'annonce, badge d'état et bouton favori. */
import ImageCarousel from '@/components/ImageCarousel.vue';
import postService from '@/services/post.service';
import { hasSession } from '@/services/session.cookies';
import { func } from '@/function';
import type { ProductDetail } from '@/types/post.types';
import { useRequireSession } from './useRequireSession';

const props = defineProps<{
    post: Pick<ProductDetail, '_id' | 'title' | 'images' | 'isSold' | 'isAvailable'>;
    /** Faux sur ses propres annonces : on ne met pas en favori ce qu'on vend. */
    canFavorite: boolean;
}>();

const favorite = defineModel<boolean>('favorite', { default: false });

const requireSession = useRequireSession(() => props.post._id);

// L'API bascule le favori (ajout comme retrait) et rend `false` en cas d'échec.
async function toggleFavorite() {
    if (!requireSession()) return;
    const adding = !favorite.value;
    if (await postService.addFavorite(props.post._id)) {
        func.showToastSuccess(adding ? 'Ajouté à mes favoris' : 'Supprimé de mes favoris');
        favorite.value = adding;
    } else if (hasSession()) {
        // Sans session, l'utilisateur est déjà renvoyé vers /login : rien à afficher.
        func.showToastError('Impossible de mettre à jour vos favoris. Réessayez.');
    }
}
</script>
