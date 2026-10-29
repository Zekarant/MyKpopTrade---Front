<template>
    <div v-dismiss="() => emit('cancel')" class="post-modal__confirm-overlay" @keydown.esc="emit('cancel')">
        <div
            ref="dialog"
            class="post-modal__confirm"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="hint ? hintId : undefined"
        >
            <i class="bi post-modal__confirm-icon" :class="[icon, { 'post-modal__confirm-icon--danger': variant === 'danger' }]" aria-hidden="true"></i>
            <p :id="titleId">{{ title }}</p>
            <p v-if="hint" :id="hintId" class="post-modal__confirm-hint">{{ hint }}</p>
            <div class="post-modal__confirm-actions">
                <button ref="cancelButton" type="button" class="post-modal__btn post-modal__btn--outline" @click="emit('cancel')">Annuler</button>
                <button type="button" class="post-modal__btn" :class="`post-modal__btn--${variant}`" :disabled="busy" @click="emit('confirm')">
                    {{ confirmLabel }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/** Confirmation d'une action du vendeur sur sa fiche (vendu, remise en vente, suppression). */
import { ref, useId } from 'vue';
import { useDialogFocus } from '@/composables/useDialogFocus';
import { vDismiss } from '@/composables/vDismiss';

defineProps<{
    title: string;
    confirmLabel: string;
    /** Classe Bootstrap Icons, ex. « bi-trash ». */
    icon: string;
    variant: 'primary' | 'danger';
    hint?: string;
    busy?: boolean;
}>();

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const dialog = ref<HTMLElement | null>(null);
const cancelButton = ref<HTMLElement | null>(null);
const titleId = `post-confirm-title-${useId()}`;
const hintId = `post-confirm-hint-${useId()}`;

// Annuler par défaut : une validation au clavier ne doit pas supprimer ni vendre par mégarde.
useDialogFocus(dialog, cancelButton);
</script>
