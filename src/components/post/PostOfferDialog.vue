<template>
    <div ref="dialog" role="dialog" aria-modal="true" aria-label="Faire une offre">
        <send_offer :product="product" @offer-sent="sendOffer" @close="emit('close')" />
    </div>
</template>

<script setup lang="ts">
/**
 * Offre sur une annonce : send_offer saisit le montant, la négociation est
 * ouverte ici. Le cadre porte le rôle de dialogue et le focus, que send_offer
 * (partagé avec la messagerie) ne gère pas.
 */
import { ref } from 'vue';
import send_offer from '@/components/send_offer.vue';
import type { OfferSentPayload } from '@/components/offerRules';
import messagingService from '@/services/messaging.service';
import { func } from '@/function';
import { useDialogFocus } from '@/composables/useDialogFocus';
import type { ProductDetail } from '@/types/post.types';

defineProps<{ product: ProductDetail }>();

const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLElement | null>(null);
useDialogFocus(dialog, undefined, () => emit('close'));

function sendOffer(offer: OfferSentPayload) {
    emit('close');
    messagingService.initiateNegotiation({
        productId: offer.offerData.productId,
        initialOffer: offer.amount,
        message: offer.message,
    }).then(() => {
        func.showToastSuccess('Offre envoyée avec succès !');
    }).catch((error: { message?: string }) => {
        console.error('Erreur lors de l\'envoi de l\'offre:', error);
        // Le message de l'API explique le refus (fourchette du prix libre, seuil minimal…).
        func.showToastError(error?.message || 'Erreur lors de l\'envoi de l\'offre.');
    });
}
</script>
