<template>
    <PostConfirmDialog
        v-if="dialog === 'sold'"
        title="Marquer cet article comme vendu ?"
        confirm-label="Confirmer"
        icon="bi-cart-check"
        variant="danger"
        :busy="busy"
        @cancel="emit('close')"
        @confirm="run(markAsSold, 'Impossible de marquer cet article comme vendu.')"
    />
    <PostConfirmDialog
        v-else-if="dialog === 'relist'"
        title="Remettre cet article en vente ?"
        :hint="isSold ? 'La vente sera annulée et l\'article de nouveau visible par les acheteurs.' : undefined"
        confirm-label="Remettre en vente"
        icon="bi-arrow-counterclockwise"
        variant="primary"
        :busy="busy"
        @cancel="emit('close')"
        @confirm="run(relist, 'Impossible de remettre cet article en vente.')"
    />
    <PostConfirmDialog
        v-else-if="dialog === 'delete'"
        title="Supprimer définitivement cet article ?"
        confirm-label="Supprimer"
        icon="bi-trash"
        variant="danger"
        :busy="busy"
        @cancel="emit('close')"
        @confirm="run(deletePost, 'Impossible de supprimer cet article.')"
    />
</template>

<script setup lang="ts">
/** Confirmations du vendeur sur sa fiche : vendu hors plateforme, remise en vente, suppression. */
import { ref } from 'vue';
import PostConfirmDialog from './PostConfirmDialog.vue';
import postService from '@/services/post.service';
import { apiErrorMessage } from '@/services/apiError';
import { func } from '@/function';
import type { OwnerDialog } from './types';

const props = defineProps<{
    dialog: OwnerDialog | null;
    productId: string;
    isSold?: boolean;
}>();

/** `changed` : l'annonce a changé d'état, le parent rafraîchit ou referme la fiche. */
const emit = defineEmits<{ close: []; changed: [] }>();

const busy = ref(false);

/** Vente conclue hors de la plateforme : aucun acheteur n'est déclaré. */
async function markAsSold() {
    if (!await postService.sold(props.productId)) {
        throw new Error('Vente non enregistrée');
    }
}

async function relist() {
    await postService.relist(props.productId);
    func.showToastSuccess('Article remis en vente');
}

async function deletePost() {
    await postService.deletePost(props.productId);
}

async function run(action: () => Promise<void>, errorMessage: string) {
    if (busy.value) return;
    busy.value = true;
    try {
        await action();
        emit('close');
        emit('changed');
    } catch (error) {
        func.showToastError(apiErrorMessage(error, errorMessage));
    } finally {
        busy.value = false;
    }
}
</script>
