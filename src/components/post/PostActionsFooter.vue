<template>
    <div class="post-modal__footer" @click.capture="guardAnonymousAction">
        <button v-if="canMakeOffer" type="button" class="post-modal__btn post-modal__btn--outline" @click="emit('offer')">
            <i class="bi bi-tag" aria-hidden="true"></i> Faire une offre
        </button>
        <button type="button" class="post-modal__btn post-modal__btn--primary" @click="emit('buy')">
            <i class="bi bi-bag" aria-hidden="true"></i> Acheter
        </button>
        <button
            type="button"
            class="post-modal__btn post-modal__btn--cart"
            :class="{ 'post-modal__btn--cart-added': addedToCart }"
            :disabled="addingToCart || addedToCart"
            @click="addToCart"
        >
            <i class="bi" :class="addedToCart ? 'bi-cart-check-fill' : 'bi-cart-plus'" aria-hidden="true"></i>
            {{ addedToCart ? 'Ajouté ✓' : addingToCart ? '...' : 'Panier' }}
        </button>
        <button type="button" class="post-modal__btn post-modal__btn--ghost" @click="emit('message')">
            <i class="bi bi-chat-dots" aria-hidden="true"></i> Message
        </button>
    </div>
</template>

<script setup lang="ts">
/** Actions d'achat d'une annonce disponible : offre, achat, panier, message. */
import { ref } from 'vue';
import cartService from '@/services/cart.service';
import { useCartStore } from '@/store/cart.store';
import { apiErrorMessage } from '@/services/apiError';
import { func } from '@/function';
import { useRequireSession } from './useRequireSession';

const props = defineProps<{ productId: string; canMakeOffer: boolean }>();

const emit = defineEmits<{ offer: []; buy: []; message: [] }>();

const cartStore = useCartStore();
const requireSession = useRequireSession(() => props.productId);
const addingToCart = ref(false);
const addedToCart = ref(false);

/** Toutes ces actions exigent un compte : on intercepte le clic avant qu'il n'atteigne le bouton. */
function guardAnonymousAction(event: MouseEvent) {
    if ((event.target as Element).closest('button') && !requireSession()) {
        event.stopPropagation();
    }
}

async function addToCart() {
    if (addingToCart.value || addedToCart.value) return;
    addingToCart.value = true;
    try {
        await cartService.addItem(props.productId);
        addedToCart.value = true;
        func.showToastSuccess('Article ajouté au panier !');
        // Le badge du panier dans la barre de navigation suit le store.
        cartStore.refresh();
    } catch (error) {
        func.showToastError(apiErrorMessage(error, 'Erreur lors de l\'ajout au panier'));
    } finally {
        addingToCart.value = false;
    }
}
</script>
